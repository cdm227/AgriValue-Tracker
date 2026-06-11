from datetime import date
from typing import List, Dict
from pydantic import Field, field_validator
from .crop_types import BaseAgriModel, CropType, LocationZone

class FieldContext(BaseAgriModel):
    """
    Validated field context payload collected from sensors and calendars.
    """
    farm_id: str = Field(..., description="Unique identifier for the farm, e.g., FARM-001", min_length=3)
    parcel_ids: List[str] = Field(..., description="List of parcel IDs under management", min_length=1)
    crops: List[CropType] = Field(..., description="Crops currently planted across the parcels")
    growth_stages: Dict[str, str] = Field(..., description="Mapping of parcel ID to its current growth stage")
    hours_available_today: float = Field(..., description="Total available labor/work hours today", ge=0.0, le=24.0)
    current_date: date = Field(..., description="Date of context collection")
    location_zone: LocationZone = Field(..., description="Geographical zone in Sicily")
    soil_moisture_readings: Dict[str, float] = Field(..., description="Sensor soil moisture % readings per parcel")
    last_action_per_parcel: Dict[str, str] = Field(..., description="Last executed action per parcel")

    @field_validator("soil_moisture_readings")
    @classmethod
    def validate_moisture(cls, v: Dict[str, float]) -> Dict[str, float]:
        for parcel, moisture in v.items():
            if not (0.0 <= moisture <= 100.0):
                raise ValueError(f"Soil moisture for {parcel} must be between 0.0% and 100.0%, got {moisture}")
        return v
