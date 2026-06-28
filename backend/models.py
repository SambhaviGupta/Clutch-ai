from pydantic import BaseModel
from typing import List, Optional

class CrisisInput(BaseModel):
    message: str
    user_timezone: Optional[str] = "Asia/Kolkata"

class SprintBlock(BaseModel):
    title: str
    goal: str
    duration_minutes: int
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    calendar_event_id: Optional[str] = None

class ProgressUpdate(BaseModel):
    sprint_index: int
    completed: bool
    time_remaining_minutes: int
    remaining_sprints: Optional[List[dict]] = []