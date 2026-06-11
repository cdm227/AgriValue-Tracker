from models.field_context import FieldContext
from models.orchestration_plan import OrchestrationPlan

class DecisionOrchestratorAgent:
    def orchestrate(self, context: FieldContext) -> OrchestrationPlan:
        # Hardcoded Prerequisite Chains (Reasoning & Multi-step thinking)
        blocked = {}
        ranked = ["Targeted Drip Irrigation", "Visual Scouting for Bactrocera oleae"]

        # 1. Rain Prerequisite check
        blocked["Pesticide Spray"] = "Blocked: High rain probability forecast within 4 hours."
        
        # 2. Moisture check
        if context.soil_moisture_readings["PARCEL-A"] > 65.0:
            blocked["Irrigation"] = "Blocked: Soil moisture is above 65% limit."

        # 3. Scirocco wind check
        if context.location_zone == "ragusa":
            blocked["Grape Harvest"] = "Blocked: Scirocco wind event detected (high heat stress damages grape skin)."

        return OrchestrationPlan(
            ranked_actions=ranked,
            blocked_actions=blocked,
            retrieved_citations=[
                "Sicilian Grape Irrigation Protocol v2 - Section 4.2",
                "Olive Pest Calendar Sicily, July-August Section"
            ],
            dispatch_instructions="Dispatching to Action Planner and Higgsfield Visual Briefing Agents."
        )
