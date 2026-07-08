# Clutch AI — Autonomous Deadline Rescue Agent

> You're behind. Let's fix that.

Clutch is an autonomous AI agent that rescues you from last-minute deadlines. Describe your crisis, and the agent classifies your task, generates actual work content, builds a time-blocked sprint plan, and books it on your Google Calendar — all autonomously.

**Live Demo:** https://clutch-ai-frontend.vercel.app

---
## How it works

1. User describes their crisis ("I have 3 hours before my DBMS exam")
2. Agent chains three tools autonomously via Groq function calling:
   - `classify_deadline` — identifies task type, urgency, time available
   - `generate_work_artifact` — creates revision sheet, outline, or talking points
   - `create_sprint_plan` — builds time-blocked action sprints
3. Sprint blocks are booked directly on Google Calendar
4. User tracks progress with real-time sprint tracker

---

## Tech Stack

**Backend**
- FastAPI (Python)
- Groq API with `llama-3.3-70b-versatile` (function calling agent)
- Google Calendar API (OAuth 2.0)
- Deployed on Render

**Frontend**
- React + Vite
- react-markdown, axios, react-router-dom
- Deployed on Vercel

---

## Architecture
User Input → FastAPI /rescue endpoint
↓
Groq Agent Loop
┌─────────────────────────────┐
│ 1. classify_deadline        │
│ 2. generate_work_artifact   │
│ 3. create_sprint_plan       │
└─────────────────────────────┘
↓
Response → React Dashboard
↓
Google Calendar API → Sprint blocks booked

---

## Local Setup

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create `.env` in `/backend`:
GROQ_API_KEY=your_groq_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback

```bash
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Features

- Natural language crisis input
- Voice input (Web Speech API)
- Autonomous 3-tool agent chain (no user micromanagement)
- AI-generated work artifacts (revision sheets, outlines, talking points, code scaffolds)
- Google Calendar auto-booking
- Real-time sprint tracker
- Dark rescue-mode UI

---

## Built for

Vibe2Ship Hackathon — Coding Ninjas × Google for Developers