from typing import Literal
from pydantic import BaseModel, ConfigDict

CropType = Literal["grape", "olive", "wheat", "almond"]
LocationZone = Literal["palermo", "trapani", "ragusa", "agrigento", "catania", "messina"]

class BaseAgriModel(BaseModel):
    """Base Pydantic model for all AgriValue-Tracker schemas ensuring strict validation."""
    model_config = ConfigDict(
        frozen=True,
        validate_assignment=True,
        extra="forbid",
        str_strip_whitespace=True,
    )
