# 🛠 SocratAI Setup Guide

This guide provides the steps to set up and run SocratAI locally for development using VS Code.

## Prerequisites
- **Node.js**: v18.0+
- **Python**: v3.9+
- **VS Code**: Latest version recommended
- **Gemini API Key**: Obtain one from [Google AI Studio](https://aistudio.google.com/)

---

## 🏗 Backend Setup

1. **Open Workspace**: Open the `backend` folder in VS Code.
2. **Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables**:
   Create a `.env` file or export the variable:
   ```bash
   export GEMINI_API_KEY=AIza...
   ```
5. **Run Server**:
   ```bash
   python main.py
   ```
   *Backend will be available at `http://localhost:8000`*

---

## 🎨 Frontend Setup

1. **Open Workspace**: Open the `frontend` folder in VS Code.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   *Frontend will be available at `http://localhost:3000`*

---

## 🔍 VS Code Recommended Configuration

To get the best experience while working on SocratAI, ensure your VS Code settings include:

```json
{
  "editor.formatOnSave": true,
  "python.analysis.typeCheckingMode": "basic",
  "tailwindCSS.includeLanguages": {
    "plaintext": "html"
  }
}
```

## 🐛 Troubleshooting
- **CORS Errors**: Ensure the frontend is running on `http://localhost:3000` as the backend expects this origin.
- **API Issues**: Verify your `GEMINI_API_KEY` is active and has sufficient quota.
- **Port Conflicts**: If port 3000 or 8000 is taken, the startup scripts will warn you.
