# AI Pro Quiz - Setup Instructions

A high-intelligence AI question generation engine and adaptive quiz system.

## Prerequisites
- Python 3.8+
- Node.js (for simple frontend serving, or use any static server)

## Installation

1. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Backend**:
   ```bash
   python -m uvicorn app.main:app --port 8000 --reload
   ```

3. **Run the Frontend**:
   You can serve the `frontend` directory using any static server. For example:
   ```bash
   cd frontend
   npx serve .
   ```
   Or simply open `index.html` in your browser.

## Features
- **Intelligent Generation**: Uses `FLAN-T5` for high-quality MCQs, Fill-in-the-blanks, and Short Answers.
- **Adaptive Modules**: 5-module system that adjusts difficulty and Bloom's level based on accuracy and speed.
- **Premium UI**: Modern glassmorphism design with responsive elements and behavioral tracking.
- **OCR & PDF Support**: Instant text extraction from documents and images.
