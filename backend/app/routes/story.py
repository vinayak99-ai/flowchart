from fastapi import APIRouter, HTTPException, Response, WebSocket, WebSocketDisconnect
from openai import OpenAIError
from pydantic import BaseModel, ValidationError

from app.infographic_template import build_deck_pptx
from app.spec_builder.export import export_to_markdown
from app.spec_builder.persistence import list_artifacts, list_projects, load_artifact
from app.story_llm import generate_story, plan_story
from app.story_models import (
    STORY_DEFAULT_MINUTES,
    STORY_MAX_MINUTES,
    STORY_MIN_MINUTES,
    StoryScript,
    StorySourceProject,
)

router = APIRouter(prefix="/api")


class StoryGenerateRequest(BaseModel):
    project_id: str
    total_minutes: int = STORY_DEFAULT_MINUTES
    prompt: str = ""


def _load_source_prd_markdown(project_id: str) -> tuple[str, str]:
    """Resolves a Spec Builder project to the markdown text of its primary
    artifact -- the same artifact `_summarize_project` treats as canonical
    (list_artifacts()[0]) -- for use as the story planner's source
    material. Raises 404s a route can surface directly."""
    artifact_ids = list_artifacts(project_id)
    if not artifact_ids:
        raise HTTPException(
            status_code=404,
            detail="This project has no generated spec yet -- generate one in Spec Builder first.",
        )
    prd = load_artifact(project_id, artifact_ids[0])
    return export_to_markdown(prd), prd.title


@router.get("/story/projects", response_model=list[StorySourceProject])
def api_list_source_projects():
    return [
        StorySourceProject(id=p.id, name=p.name, has_prd=bool(list_artifacts(p.id)))
        for p in list_projects()
    ]


@router.post("/story/export/script")
def api_export_script(story: StoryScript) -> Response:
    lines = [
        f"# {story.title}",
        "",
        f"**Source project:** {story.source_project_name}  ",
        f"**Total length:** {story.total_minutes} minutes",
        "",
    ]
    for beat in story.beats:
        lines.append(f"## {beat.label} ({beat.start_minute:.0f}–{beat.end_minute:.0f} min)")
        lines.append("")
        lines.append(beat.narration)
        lines.append("")
    markdown = "\n".join(lines)
    return Response(
        content=markdown,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="story-script.md"'},
    )


@router.post("/story/export/deck")
def api_export_deck(story: StoryScript) -> Response:
    pptx_bytes = build_deck_pptx([beat.slide for beat in story.beats])
    return Response(
        content=pptx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": 'attachment; filename="story-deck.pptx"'},
    )


@router.websocket("/ws/generate-story")
async def generate_story_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            try:
                request = StoryGenerateRequest.model_validate(payload)
            except ValidationError as exc:
                await websocket.send_json({"stage": "error", "message": str(exc)})
                continue

            if not (STORY_MIN_MINUTES <= request.total_minutes <= STORY_MAX_MINUTES):
                await websocket.send_json(
                    {
                        "stage": "error",
                        "message": f"Demo length must be between {STORY_MIN_MINUTES} and {STORY_MAX_MINUTES} minutes.",
                    }
                )
                continue

            try:
                prd_text, project_title = _load_source_prd_markdown(request.project_id)
            except HTTPException as exc:
                await websocket.send_json({"stage": "error", "message": exc.detail})
                continue

            source_project = next((p for p in list_projects() if p.id == request.project_id), None)
            project_name = source_project.name if source_project else project_title

            await websocket.send_json({"stage": "planning"})
            try:
                plan = await plan_story(prd_text, request.total_minutes, request.prompt)
            except OpenAIError as exc:
                await websocket.send_json({"stage": "error", "message": f"OpenAI request failed: {exc}"})
                continue

            if not plan.beats:
                await websocket.send_json({"stage": "error", "message": "The plan produced no beats."})
                continue

            await websocket.send_json({"stage": "plan_ready", "plan": plan.model_dump()})

            async def on_beat_done(completed: int, total: int) -> None:
                await websocket.send_json({"stage": "generating", "completed": completed, "total": total})

            try:
                story = await generate_story(
                    prd_text, request.project_id, project_name, request.total_minutes,
                    request.prompt, plan, on_beat_done,
                )
            except OpenAIError as exc:
                await websocket.send_json({"stage": "error", "message": f"OpenAI request failed: {exc}"})
                continue

            await websocket.send_json({"stage": "done", "result": story.model_dump()})
    except WebSocketDisconnect:
        return
