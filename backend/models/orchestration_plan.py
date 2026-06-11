from pydantic import BaseModel
from typing import List, Dict

class OrchestrationPlan(BaseModel):
    ranked_actions: List[str]
    blocked_actions: Dict[str, str]
    retrieved_citations: List[str]
    dispatch_instructions: str
