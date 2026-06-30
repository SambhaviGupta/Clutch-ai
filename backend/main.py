from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta

load_dotenv()

from models import CrisisInput, ProgressUpdate
from agent import run_rescue_agent, execute_adapt_plan
from calendar_service import get_auth_url, exchange_code_for_tokens, book_sprint_on_calendar

app = FastAPI(title="Clutch AI - Crisis Rescue Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

token_store = {}

@app.get("/")
def root():
    return {"status": "Clutch AI is live", "message": "Crisis rescue agent ready"}

@app.get("/auth/google")
def google_auth():
    auth_url, state = get_auth_url()
    return {"auth_url": auth_url}

@app.get("/auth/callback")
def auth_callback(code: str, state: str = None):
    tokens = exchange_code_for_tokens(code)
    token_store["user"] = tokens
    return RedirectResponse(url="http://localhost:5173?auth=success")

@app.post("/rescue")
async def rescue(crisis_input: CrisisInput):
    try:
        result = await run_rescue_agent(crisis_input.message)
        return {
            "success": True,
            "task_type": result["classification"]["task_type"] if result["classification"] else "general",
            "topic": result["classification"]["topic"] if result["classification"] else "your task",
            "artifact_content": result["artifact_content"],
            "sprint_plan": result["sprint_plan"],
            "agent_message": result["agent_message"],
            "urgency_level": result["classification"]["urgency_level"] if result["classification"] else "high"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/book-calendar")
async def book_calendar(request: Request):
    body = await request.json()
    access_token = token_store.get("user", {}).get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated with Google Calendar")
    sprints = body.get("sprints", [])
    booked = []
    start_time = datetime.now() + timedelta(minutes=5)
    for sprint in sprints:
        event_id, end_time = book_sprint_on_calendar(access_token, sprint, start_time)
        sprint["calendar_event_id"] = event_id
        sprint["start_time"] = start_time.isoformat()
        sprint["end_time"] = end_time.isoformat()
        booked.append(sprint)
        start_time = end_time + timedelta(minutes=5)
    return {"success": True, "booked_sprints": booked}

@app.post("/adapt")
async def adapt(progress: ProgressUpdate):
    result = execute_adapt_plan({
        "completed_sprints": progress.sprint_index + 1,
        "time_remaining_minutes": progress.time_remaining_minutes,
        "remaining_sprints": progress.remaining_sprints
    })
    return result

@app.get("/auth/status")
def auth_status():
    return {"authenticated": "user" in token_store}