from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import json
import os

from app.utils.pdf_parser import extract_text_from_pdf
from app.utils.ocr import extract_text_from_image
from app.core.generator import QuestionGenerator
from app.core.adaptive import AdaptiveEngine, QuizState

app = FastAPI(title="SocratAI API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

generator = QuestionGenerator()
adaptive_engine = AdaptiveEngine()
sessions = {}

@app.get("/")
async def root():
    return {"message": "SocratAI API is running"}

@app.post("/upload")
async def upload_content(file: UploadFile = File(...)):
    extension = file.filename.split(".")[-1].lower()
    content = await file.read()
    
    extracted_text = ""
    if extension == "pdf":
        extracted_text = extract_text_from_pdf(content)
    elif extension in ["jpg", "jpeg", "png"]:
        extracted_text = extract_text_from_image(content)
    elif extension == "txt":
        extracted_text = content.decode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    return {"filename": file.filename, "extracted_text": extracted_text}

@app.post("/generate")
async def generate_questions(
    text: str = Form(...),
    num_questions: int = Form(5),
    question_type: str = Form("MCQ"),
    bloom_mode: str = Form("Mixed"),
    focus_topics: Optional[str] = Form(None)
):
    questions = await generator.generate_questions(
        text, num_questions, question_type, bloom_mode, focus_topics
    )
    return {"quiz": questions}

# Standard quiz session endpoints
@app.post("/quiz/start")
async def start_quiz(content: str = Form(...)):
    session_id = str(uuid.uuid4())
    state = QuizState(user_id="user_123")
    sessions[session_id] = {
        "state": state,
        "content": content,
        "history": []
    }
    
    config = adaptive_engine.get_module_config(state)
    questions = await generator.generate_questions(
        content, config["num_questions"], "MCQ", "Mixed"
    )
    
    return {
        "session_id": session_id,
        "module_info": config,
        "questions": questions
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
