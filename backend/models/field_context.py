from pydantic import BaseModel
from typing import List, Dict
from datetime import date
from .crop_types import CropType, LocationZone

class FieldContext(BaseModel):
    farm_id: str
    parcel_ids: List[str]
    crops: List[CropType]
    growth_stages: Dict[str, str]
    hours_available_today: float
    current_date: date
    location_zone: LocationZone
    soil_moisture_readings: Dict[str, float]
    last_action_per_parcel: Dict[str, str]
