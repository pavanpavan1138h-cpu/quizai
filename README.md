# 🎓 SocratAI - AI-Powered Adaptive Quiz Platform

SocratAI is a premium, AI-driven educational platform that transforms syllabus materials, notes, and images into intelligent, adaptive quizzes. Built with a focus on modern aesthetics (premium bluish-white theme) and high-accuracy AI (Gemini API), SocratAI helps students and educators master any subject through personalized assessment.

---

## 🛠 Tools and Technology Stack

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom "Bluish White" glassmorphic design system.
- **Visualizations**: [Recharts](https://recharts.org/) for the advanced Analytics Dashboard.
- **State Management**: React Hooks (useState, useMemo, useEffect).
- **Icons**: Lucide React & Custom SVG animations.

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High-performance Python API).
- **AI Intelligence**: [Google Gemini API](https://ai.google.dev/) (used for high-accuracy OCR, Question Generation, and Result Parsing).
- **OCR Service**: Gemini-powered optical character recognition for PDFs and images.
- **Database**: [SQLite](https://www.sqlite.org/) for lightweight, persistent session and stats tracking.
- **Server**: Uvicorn.

---

## 🏗 Methodology

SocratAI was developed using an **Iterative & Agile Methodology**, ensuring each component was functional and reliable before moving to the next.

1.  **Research & Prototyping**: Initial investigation into OCR accuracy and LLM prompt engineering.
2.  **Core Development**: Building the "Syllabus-to-Quiz" pipeline (File Upload → OCR extraction → AI Generation).
3.  **Refinement**: Shifting from local models to Gemini API to ensure maximum accuracy and lower hardware barriers.
4.  **User Experience (UX)**: Implementing the "Performance Analytics" dashboard and refining the visual theme for better readability.
5.  **Quality Assurance**: Continuous testing of edge cases (e.g., truncated MCQ options, various image formats).

---

## 🚀 Project Execution (Phases)

- **Phase 1: Foundation & API Reliability**: Resolved core backend bugs, unified API paths, and implemented the Gemini OCR engine.
- **Phase 2: Analytics Dashboard**: Developed the visual statistics layer using Recharts to provide users with deep insights into their mastery levels.
- **Phase 3: Visual Identity & Theming**: Created the signature "Bluish White" light theme and ensured full accessibility and contrast across all modes.
- **Phase 4: Parsing Logic Optimization**: Fixed critical issues with MCQ option rendering and improved the AI's ability to handle complex syllabus structures.
- **Phase 5: Finalization & Handover**: Prepared documentation, setup scripts, and synchronized the entire codebase with GitHub.

---

## 📱 Prototype & Environment (Hardware)

SocratAI is a **Web-based Prototype** optimized for desktop and tablet learning environments.

### Software Environment
- **Operating System**: macOS / Windows / Linux.
- **Node.js**: v18.0 or higher.
- **Python**: v3.9 or higher.
- **API Access**: Active Internet connection required for Gemini AI features.

### Hardware Requirements (Recommended)
- **RAM**: 8GB+ (for smooth local development and frontend builds).
- **Processor**: Modern quad-core CPU or higher.
- **Disk Space**: ~500MB (excluding Node/Python runtimes).

---

## 💻 Local Development (VS Code)

To run SocratAI locally using **VS Code**, follow these steps:

### 1. Recommended Extenstions
- **Python** (by Microsoft)
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **PostCSS Language Support**

### 2. Required Setup
You will need a **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).

#### Extracting & Running - Backend
1. Open a new terminal in VS Code.
2. `cd backend`
3. `python -m venv venv`
4. `source venv/bin/activate` (On Windows: `venv\Scripts\activate`)
5. `pip install -r requirements.txt`
6. `export GEMINI_API_KEY=your_key_here` (On Windows: `set GEMINI_API_KEY=your_key_here`)
7. `python main.py`

#### Extracting & Running - Frontend
1. Open a second terminal.
2. `cd frontend`
3. `npm install`
4. `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000).

---

## 📂 Project Structure
- `/frontend`: Next.js application, components, and global styles.
- `/backend`: FastAPI server, AI services (Gemini Integration), and database.
- `/uploads`: Temporary storage for processed quiz materials.

---

## 📄 License
© 2026 SocratAI. Developed for advanced AI-powered learning and assessment.
