from typing import List, Optional
from pydantic import Field
from .crop_types import BaseAgriModel

class VisualBriefingAssets(BaseAgriModel):
    """
    Higgsfield video briefing high-level overview assets.
    """
    opening_scene_url: str = Field(..., description="URL of the opening briefing scene")
    crop_condition_video_url: str = Field(..., description="URL showing the current crop canopy/growth conditions")
    weather_alert_url: str = Field(..., description="URL mapping the spatial weather alert overlay")
    metadata: str = Field(..., description="Additional briefing metadata or prompt templates")

class VisualAssets(BaseAgriModel):
    """
    Specific asset tracking model representing video rendering pipelines in Higgsfield AI.
    """
    crop: str = Field(..., description="Name of the target crop")
    zone: str = Field(..., description="Name of the geographical zone")
    video_url: Optional[str] = Field(None, description="Rendered video URL, populated once generation is complete")
    thumbnail_url: Optional[str] = Field(None, description="Generated preview thumbnail URL")
    render_status: str = Field("pending", description="Render pipeline state, e.g., 'pending', 'queued', 'processing', 'completed', 'failed'")
    scenes: List[str] = Field(default_factory=list, description="List of prompt scenes constructed for rendering")
    notes: str = Field("", description="Additional logs or diagnostic messages from Higgsfield")
