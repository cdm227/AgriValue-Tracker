from models.field_context import FieldContext
from datetime import date

class FieldScoutAgent:
    def collect_context(self, raw_input: dict) -> FieldContext:
        # Simulates reading M365 Calendar (Work IQ) to pre-populate parameters
        return FieldContext(
            farm_id=raw_input.get("farm_id", "FARM-001"),
            parcel_ids=["PARCEL-A", "PARCEL-B"],
            crops=["grape", "olive"],
            growth_stages={"PARCEL-A": "veraison", "PARCEL-B": "fruit_set"},
            hours_available_today=3.5, # Work IQ detected free slot after calendar events
            current_date=date.today(),
            location_zone=raw_input.get("location_zone", "ragusa"),
            soil_moisture_readings={"PARCEL-A": 38.0, "PARCEL-B": 42.0},
            last_action_per_parcel={"PARCEL-A": "milling", "PARCEL-B": "DOP inspection"}
        )
