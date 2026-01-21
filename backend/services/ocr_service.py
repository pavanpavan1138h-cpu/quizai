import easyocr
import re
from typing import List, Optional
import os
import ssl
import certifi
import PIL.Image
import PyPDF2
from io import BytesIO

# Fix for Pillow 10.0.0 removed ANTIALIAS
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.LANCZOS

import easyocr


class OCRService:
    def __init__(self):
        # Lazy initialization - only initialize when needed
        print("OCR service ready (will initialize on first use)")
        self.reader: Optional[easyocr.Reader] = None
        self._initialized = False
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
    
    def _initialize_reader(self):
        """Initialize EasyOCR reader lazily"""
        if self._initialized:
            return
        
        try:
            print("Initializing OCR service...")
            # Fix SSL certificate issues on macOS
            import ssl
            original_context = ssl._create_default_https_context
            ssl._create_default_https_context = ssl._create_unverified_context
            
            try:
                self.reader = easyocr.Reader(['en'], gpu=False)
            finally:
                ssl._create_default_https_context = original_context
            
            self._initialized = True
            print("OCR service initialized successfully")
        except Exception as e:
            print(f"Warning: Could not initialize OCR service: {e}")
            self.reader = None
            self._initialized = True
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from image, PDF, or TXT file"""
        ext = os.path.splitext(file_path)[1].lower()
        
        # Try Gemini first if API key is available (it's much better than EasyOCR/PyPDF2)
        if self.api_key:
            try:
                text = self.extract_text_with_gemini(file_path)
                if text and len(text.strip()) > 10:
                    return text
            except Exception as e:
                print(f"Gemini OCR extraction failed: {e}")
        
        if ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif ext == '.txt':
            return self.extract_text_from_txt(file_path)
        else:
            return self.extract_text_from_image(file_path)
    
    def extract_text_with_gemini(self, file_path: str) -> str:
        """Use Gemini to extract text from a file (Image or PDF)"""
        import google.generativeai as genai
        print(f"Using Gemini to extract text from {file_path}...")
        
        # Support for images and PDFs
        ext = os.path.splitext(file_path)[1].lower()
        mime_type = "application/pdf" if ext == '.pdf' else f"image/{ext[1:]}"
        if ext == '.jpg': mime_type = "image/jpeg"
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            
            response = model.generate_content([
                {
                    "mime_type": mime_type,
                    "data": content
                },
                "Extract all text from this document as accurately as possible. Preserve the structure if it looks like a quiz or syllabus."
            ])
            
            text = response.text
            print(f"Gemini extracted {len(text)} characters")
            return text
        except Exception as e:
            print(f"Gemini Vision error: {e}")
            return ""

    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            print(f"Processing TXT file: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            print(f"Extracted {len(text)} characters from TXT file")
            return text
        except UnicodeDecodeError:
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    text = f.read()
                print(f"Extracted {len(text)} characters from TXT file (latin-1)")
                return text
            except Exception as e:
                print(f"TXT Extraction Error: {e}")
                return ""
        except Exception as e:
            print(f"TXT Extraction Error: {e}")
            return ""

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyPDF2"""
        try:
            print(f"Processing PDF: {file_path}")
            text = ""
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page_num in range(len(reader.pages)):
                    page = reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
            
            print(f"Extracted {len(text)} characters from PDF")
            return text
        except Exception as e:
            print(f"PDF Extraction Error: {e}")
            return ""

    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from image using OCR"""
        self._initialize_reader()
        
        if self.reader is None:
            print("OCR not available, using fallback")
            return ""
        
        try:
            print(f"Processing image: {image_path}")
            results = self.reader.readtext(
                image_path, 
                detail=0, 
                paragraph=True,
                mag_ratio=1.5,
                contrast_ths=0.1,
                adjust_contrast=0.5
            )
            text = "\n\n".join(results)
            print(f"Extracted {len(text)} characters")
            return text
        except Exception as e:
            print(f"OCR Error: {e}")
            return ""
    
    def extract_topics(self, text: str) -> List[str]:
        """Extract topics from extracted text"""
        topics = []
        
        # Common patterns for syllabus topics
        # Look for numbered lists, bullet points, chapter titles, etc.
        
        # Pattern 1: Numbered topics (1., 2., etc.)
        numbered_pattern = r'\d+[\.\)]\s*([A-Z][^\n]+)'
        matches = re.findall(numbered_pattern, text)
        topics.extend([m.strip() for m in matches])
        
        # Pattern 2: Bullet points (-, *, •)
        bullet_pattern = r'[-*•]\s*([A-Z][^\n]+)'
        matches = re.findall(bullet_pattern, text)
        topics.extend([m.strip() for m in matches])
        
        # Pattern 3: Chapter/Unit titles (Chapter X:, Unit X:, etc.)
        chapter_pattern = r'(?:Chapter|Unit|Topic|Module)\s*\d*[:\-]?\s*([A-Z][^\n]+)'
        matches = re.findall(chapter_pattern, text, re.IGNORECASE)
        topics.extend([m.strip() for m in matches])
        
        # Pattern 4: Lines starting with capital letters (potential titles)
        # Relaxed logic: Accept almost any line that looks like a title
        # Also handle merged titles (e.g. "Matrix Properties of Determinants Determinant of a Matrix")
        
        raw_lines = text.split('\n')
        lines = []
        
        # Pre-process lines to split merged titles
        for r_line in raw_lines:
            r_line = r_line.strip()
            if not r_line:
                continue
                
            # Clean underscores
            if '_' in r_line:
                r_line = r_line.replace('_', ' ')
            
            # 1. First, split aggressively by large spaces or CamelCase boundaries
            temp_parts = []
            
            # Split by 3+ spaces (common in columns)
            cols = re.split(r'\s{3,}', r_line)
            for col in cols:
                if len(col) > 60:
                     # Look for: (lowercase letter) (spaces) (Capital Letter)
                     # limit split to avoid breaking sentences
                     sub_parts = re.split(r'(?<=[a-z])\s+(?=[A-Z][a-z])', col)
                     temp_parts.extend(sub_parts)
                else:
                    temp_parts.append(col)
            
            # 2. Stitch back together parts that were split on connectors (of, a, the, etc.)
            # e.g., "Determinant of a", "Matrix" -> "Determinant of a Matrix"
            merged_parts = []
            if temp_parts:
                current_part = temp_parts[0]
                connectors = {'of', 'a', 'an', 'the', 'and', 'or', 'for', 'to', 'in', 'with', 'by', 'using'}
                
                for i in range(1, len(temp_parts)):
                    next_part = temp_parts[i]
                    # Check if current part ends with a connector
                    words = current_part.strip().split()
                    if words and words[-1].lower() in connectors:
                        # Append next part to current
                        current_part += " " + next_part
                    else:
                        # Push current and start new
                        merged_parts.append(current_part)
                        current_part = next_part
                merged_parts.append(current_part)
                lines.extend(merged_parts)

        topics = []
        for line in lines:
            line = line.strip()
            # Filter incomplete fragments often caused by bad OCR or splitting
            if len(line.split()) < 2 and line.lower() in {'matrix', 'formula', 'introduction'}:
                 # Skip generic single words if they likely belong to a fuller title
                 continue
                 
            if len(line) > 5 and len(line) < 100:
                # Must start with letter, have some content
                if line[0].isalnum():
                    # If it's not a sentence (doesn't end in .) or it's a short "sentence" acting as title
                    if not line.endswith('.') or len(line) < 60:
                        topics.append(line)
        
        # Remove duplicates and clean
        topics = list(set(topics))
        topics = [t for t in topics if len(t) > 5 and len(t) < 100]
        
        # Filter out "topics" that are just verbs/connectors
        bad_starts = {'how to', 'methods to', 'types of', 'properties of'}
        final_topics = []
        for t in topics:
            if t.lower() in bad_starts:
                continue
            final_topics.append(t)
            
        topics = final_topics
        
        # If no topics found, just use the raw lines
        if not topics:
            print("No structured topics found, using raw lines as topics")
            topics = [line.strip() for line in raw_lines if len(line.strip()) > 8]
        
        print(f"Extracted {len(topics)} topics: {topics[:3]}...")
        return topics[:20]  # Return top 20 topics
