from datetime import datetime
from typing import Literal, Optional, Dict, Any
from pydantic import Field
from .crop_types import BaseAgriModel, CropType

class SeasonInsight(BaseAgriModel):
    """
    Model representing logged analytical insights, performance metrics, and logs
    committed to Microsoft Fabric OneLake/Rayfin for the current agricultural season.
    """
    insight_id: str = Field(..., description="Unique UUID or hash of the season insight log")
    farm_id: str = Field(..., description="Identifier of the farm being logged")
    crop: CropType = Field(..., description="Crop associated with this insight")
    logged_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the insight was registered")
    category: Literal["irrigation", "soil", "pest", "yield", "weather", "financial"] = Field(
        ..., description="Category of the logged insight"
    )
    metric_summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="Key-value metrics captured (e.g., soil moisture, yield forecasts, acidity)"
    )
    severity_level: Literal["INFO", "WARNING", "CRITICAL"] = Field("INFO", description="Urgency of the registered signal")
    observation: str = Field(..., description="Detailed observation or telemetry summary")
    compliance_passed: bool = Field(True, description="Whether DOP/DOC compliance conditions were met")
    write_receipt: Optional[str] = Field(None, description="Write confirmation hash from OneLake/Rayfin ledger")
