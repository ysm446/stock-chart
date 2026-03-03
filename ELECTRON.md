# Electron Setup

## Overview
- Renderer: existing `frontend` (React + Vite)
- Backend: existing `backend` (FastAPI) launched by Electron main process
- Desktop shell: `electron/main.cjs`

## Prerequisites
- Node.js 18+
- Python 3.11+
- Backend dependencies installed in `backend`

## First-time setup
```bash
# backend dependencies
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# electron dependencies (project root)
cd ..
npm install
```

## Run in development
```bash
cd <project-root>
npm run dev
```

Behavior in dev:
- Vite dev server starts on `http://127.0.0.1:5173`
- Electron starts and opens that URL
- Electron also starts FastAPI on `127.0.0.1:8000`

## Build desktop app
```bash
cd <project-root>
npm run dist
```

This performs:
1. Frontend build with `VITE_API_BASE_URL=http://127.0.0.1:8000/api`
2. Electron packaging via `electron-builder`

## Notes
- If Python is not on PATH, set `BACKEND_PYTHON` before launch.
  - Example: `set BACKEND_PYTHON=C:\path\to\python.exe`
- Packaged app still requires Python runtime and backend dependencies unless you additionally package backend as an executable (e.g. PyInstaller).
