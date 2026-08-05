from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes.generate import router as generate_router
from app.pm_portal_app import pm_portal_app

settings = get_settings()

app = FastAPI(title="Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router)

# Spec Builder's own FastAPI app, routed at /pm/* -- e.g. /pm/projects. It
# keeps its own CORS middleware (pm-portal/backend/main.py), which already
# covers Studio's frontend origin.
app.mount("/pm", pm_portal_app)
