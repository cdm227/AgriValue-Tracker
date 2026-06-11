from typing import List
from pydantic import Field, field_validator
import re
from .crop_types import BaseAgriModel

class TaskCard(BaseAgriModel):
    """
    Individually timed task allocation card containing actionable instructions.
    """
    time_window: str = Field(..., description="Time window for task execution, e.g., '07:00-09:30'")
    parcel_id: str = Field(..., description="The parcel identifier where the task occurs")
    crop: str = Field(..., description="Name of the crop on the parcel")
    action: str = Field(..., description="The specific, detailed agricultural action to execute")
    reason: str = Field(..., description="Rational explanation grounded in field observations and rules")
    citation: str = Field(..., description="Reference citation matching agronomic protocols")

    @field_validator("time_window")
    @classmethod
    def validate_time_window_format(cls, v: str) -> str:
        # Expected format like "HH:MM-HH:MM"
        pattern = r"^\d{2}:\d{2}-\d{2}:\d{2}$"
        if not re.match(pattern, v):
            raise ValueError("time_window must be in 'HH:MM-HH:MM' format")
        return v

class DailyActionPlan(BaseAgriModel):
    """
    The final action planner daily task list, assigned to a specific farm.
    """
    date: str = Field(..., description="The calendar day for the action plan (e.g. YYYY-MM-DD or descriptive name)")
    farm_id: str = Field(..., description="The farm ID to which this plan is allocated")
    hours_allocated: float = Field(..., description="Total work hours allocated for these tasks", ge=0.0, le=24.0)
    tasks: List[TaskCard] = Field(..., description="Ordered list of task cards scheduled for today")
