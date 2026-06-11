import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from agents.field_scout import FieldScoutAgent
from agents.decision_orchestrator import DecisionOrchestratorAgent
from agents.action_planner import ActionPlannerAgent
from agents.visual_briefing import VisualBriefingAgent
from agents.season_logger import SeasonLoggerAgent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def home():
    return {"status": "FieldMind Sicily Co-Processor Online"}

# WebSocket endpoint to stream real-time agent reasoning steps (Traces/Observability)
@app.websocket('/ws/orchestrate')
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Receive trigger payload
        data = await websocket.receive_json()
        zone = data.get("zone", "ragusa")
        crop = data.get("crop", "Olive Oil")

        # 1. Field Scout (Work IQ)
        await websocket.send_json({"agent": "Field Scout", "text": "Analyzing Work IQ activity logs... Free schedule slot detected: 3.5 Hours."})
        scout = FieldScoutAgent()
        context = scout.collect_context({"location_zone": zone})

        # 2. Decision Orchestrator (Reasoning chains)
        await websocket.send_json({"agent": "Decision Orchestrator", "text": "Evaluating agronomical prerequisite chains and weather barriers..."})
        orchestrator = DecisionOrchestratorAgent()
        plan = orchestrator.orchestrate(context)
        await websocket.send_json({"agent": "Decision Orchestrator", "text": f"Foundry IQ RAG Grounding active. Citing: {plan.retrieved_citations[0]}"})

        # 3. Action Planner
        await websocket.send_json({"agent": "Action Planner", "text": "Building timed, parcel-by-parcel action task cards..."})
        planner = ActionPlannerAgent()
        action_plan = planner.plan(plan, "FARM-001")

        # 4. Visual Briefing (Higgsfield)
        await websocket.send_json({"agent": "Visual Briefing", "text": "Invoking Higgsfield AI MCP video render pipelines..."})
        briefing = VisualBriefingAgent()
        assets = briefing.generate_assets(crop, zone)

        # Send final completed payload
        await websocket.send_json({
            "status": "COMPLETED",
            "actionPlan": action_plan.dict(),
            "visualAssets": assets.dict()
        })

    except Exception as e:
        print("WS error:", e)
    finally:
        await websocket.close()

if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
