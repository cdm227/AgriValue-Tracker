from pydantic import BaseModel
from typing import List

class VisualBriefingAssets(BaseModel):
    opening_scene_url: str
    crop_condition_video_url: str
    weather_alert_url: str
    metadata: str
