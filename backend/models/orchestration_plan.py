from typing import List, Dict
from pydantic import Field
from .crop_types import BaseAgriModel

class OrchestrationPlan(BaseAgriModel):
    """
    Decision Orchestrator output plan outlining recommended and blocked tasks
    for today's agricultural activities based on rules and reasoning.
    """
    ranked_actions: List[str] = Field(
        ...,
        description="Ranked list of recommended agronomic actions to perform."
    )
    blocked_actions: Dict[str, str] = Field(
        ...,
        description="Actions that are blocked mapping to the reason/constraint preventing them."
    )
    retrieved_citations: List[str] = Field(
        ...,
        description="Grounded compliance or agronomic protocol references."
    )
    dispatch_instructions: str = Field(
        ...,
        description="High-level dispatch guidance for the execution planner."
    )
