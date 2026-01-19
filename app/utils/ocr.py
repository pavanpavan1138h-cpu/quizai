import easyocr
import numpy as np
from PIL import Image
import io

# Initialize the reader once
reader = None

def get_reader():
    global reader
    if reader is None:
        reader = easyocr.Reader(['en'])
    return reader

def extract_text_from_image(file_content: bytes) -> str:
    """Extracts text from an image file content using EasyOCR."""
    try:
        image = Image.open(io.BytesIO(file_content))
        image_np = np.array(image)
        
        ocr_reader = get_reader()
        results = ocr_reader.readtext(image_np)
        
        text = " ".join([res[1] for res in results])
        return text.strip()
    except Exception as e:
        print(f"Error extracting OCR: {e}")
        return ""
