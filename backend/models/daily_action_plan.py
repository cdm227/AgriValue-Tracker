from pydantic import BaseModel
from typing import List, Dict

class TaskCard(BaseModel):
    time_window: str
    parcel_id: str
    crop: str
    action: str
    reason: str
    citation: str

class DailyActionPlan(BaseModel):
    date: str
    farm_id: str
    hours_allocated: float
    tasks: List[TaskCard]
