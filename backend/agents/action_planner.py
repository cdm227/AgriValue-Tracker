from models.orchestration_plan import OrchestrationPlan
from models.daily_action_plan import DailyActionPlan, TaskCard

class ActionPlannerAgent:
    def plan(self, plan: OrchestrationPlan, farm_id: str) -> DailyActionPlan:
        # Build specific, timed task cards using Foundry IQ citations
        tasks = [
            TaskCard(
                time_window="07:00-09:30",
                parcel_id="PARCEL-A",
                crop="Nero d'Avola Grapes",
                action="Targeted irrigation - 18L/m2 drip, avoid wetting foliage",
                reason="Soil moisture at 38% (threshold met), forecast heat 36C, veraison critical window.",
                citation="Foundry IQ -> Sicilian Grape Irrigation Protocol v2, Section 4.2"
            ),
            TaskCard(
                time_window="10:00-12:00",
                parcel_id="PARCEL-B",
                crop="Nocellara Olive",
                action="Visual scouting for Bactrocera oleae - check yellow traps",
                reason="Pest pressure threshold reached on adjacent farm. Trap count check is required.",
                citation="Foundry IQ -> Olive Pest Calendar Sicily, July-August section"
            )
        ]
        return DailyActionPlan(
            date="Today",
            farm_id=farm_id,
            hours_allocated=3.5,
            tasks=tasks
        )
