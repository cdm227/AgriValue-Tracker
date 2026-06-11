from datetime import datetime
from typing import List, Literal, Optional
from pydantic import Field
from .crop_types import BaseAgriModel

class EngagementSignal(BaseAgriModel):
    """
    Push engagement signal representing real-time alerts, warnings, and
    anomalies (such as Scirocco winds, pest alerts, or moisture thresholds)
    dispatched to agricultural managers and farmers.
    """
    signal_id: str = Field(..., description="Unique UUID or identifier for the engagement warning")
    farm_id: str = Field(..., description="Associated farm identifier")
    parcel_id: Optional[str] = Field(None, description="Target parcel ID if specific to a location")
    signal_type: Literal["INFO", "ADVISORY", "WARNING", "CRITICAL_ALERT"] = Field(
        ..., description="Severity type of the notification signal"
    )
    source_agent: str = Field(..., description="The agent generating the warning signal, e.g., 'DecisionOrchestrator'")
    title: str = Field(..., description="Short heading of the engagement signal")
    message: str = Field(..., description="Detailed descriptive advice or warning explanation")
    wind_speed_kph: Optional[float] = Field(None, description="Wind speed reading if warning is weather/Scirocco related", ge=0.0)
    rain_probability: Optional[float] = Field(None, description="Rain probability percentage if warning is precipitation related", ge=0.0, le=100.0)
    soil_moisture_pct: Optional[float] = Field(None, description="Soil moisture reading related to alert", ge=0.0, le=100.0)
    is_acknowledged: bool = Field(False, description="Whether the farmer/operator has viewed or acknowledged the alert")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the signal was broadcast")
    remediation_steps: List[str] = Field(
        default_factory=list,
        description="Suggested immediate actions the operator can take to address the warning"
    )
