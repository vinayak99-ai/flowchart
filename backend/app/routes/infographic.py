from fastapi import APIRouter, Response, WebSocket, WebSocketDisconnect
from openai import OpenAIError
from pydantic import ValidationError

from app.infographic_llm import (
    classify_infographic_template,
    generate_deck,
    generate_infographic,
    plan_deck,
)
from app.infographic_models import (
    BULLET_MAX_COUNT,
    BULLET_MIN_COUNT,
    COMPARISON_MAX_COLUMNS,
    MATRIX_QUADRANT_COUNT,
    PYRAMID_MAX_PILLARS,
    PYRAMID_MIN_PILLARS,
    TIMELINE_MAX_MILESTONES,
    TIMELINE_MIN_MILESTONES,
    BulletSummarySlide,
    GenerateDeckResponse,
    GenerateInfographicResponse,
    InfographicComparison,
    InfographicDiagram,
    InfographicMatrix,
    InfographicPyramid,
    InfographicRoadmap,
    InfographicTimeline,
    InfographicWheel,
    WHEEL_ITEM_COUNT,
)
from app.infographic_template import (
    build_bullets_pptx,
    build_comparison_pptx,
    build_deck_pptx,
    build_matrix_pptx,
    build_pyramid_pptx,
    build_roadmap_pptx,
    build_timeline_pptx,
    build_wheel_pptx,
)
from app.models import GenerateRequest, ValidationIssue, ValidationSeverity

router = APIRouter(prefix="/api")

_EXPORT_BUILDERS = {
    "radial_wheel": (build_wheel_pptx, "infographic-wheel.pptx"),
    "comparison_columns": (build_comparison_pptx, "infographic-comparison.pptx"),
    "now_next_later": (build_roadmap_pptx, "infographic-roadmap.pptx"),
    "vision_pyramid": (build_pyramid_pptx, "infographic-vision-pyramid.pptx"),
    "quarterly_timeline": (build_timeline_pptx, "infographic-timeline.pptx"),
    "bullet_summary": (build_bullets_pptx, "infographic-bullets.pptx"),
    "matrix_2x2": (build_matrix_pptx, "infographic-matrix.pptx"),
}


def _validate_infographic(data: InfographicDiagram) -> list[ValidationIssue]:
    if isinstance(data, InfographicWheel):
        if len(data.items) != WHEEL_ITEM_COUNT:
            return [
                ValidationIssue(
                    severity=ValidationSeverity.warning,
                    code="wrong_item_count",
                    message=f"Wheel has {len(data.items)} items; the template has exactly {WHEEL_ITEM_COUNT} slots.",
                )
            ]
        return []

    if isinstance(data, InfographicComparison):
        if not data.columns or len(data.columns) > COMPARISON_MAX_COLUMNS:
            return [
                ValidationIssue(
                    severity=ValidationSeverity.warning,
                    code="wrong_column_count",
                    message=f"Comparison has {len(data.columns)} columns; the template supports up to {COMPARISON_MAX_COLUMNS}.",
                )
            ]
        return []

    if isinstance(data, InfographicRoadmap):
        if len(data.columns) != 3:
            return [
                ValidationIssue(
                    severity=ValidationSeverity.warning,
                    code="wrong_column_count",
                    message=f"Roadmap has {len(data.columns)} columns; the template has exactly 3 (Now/Next/Later).",
                )
            ]
        return []

    if isinstance(data, InfographicPyramid):
        if not (PYRAMID_MIN_PILLARS <= len(data.pillars) <= PYRAMID_MAX_PILLARS):
            return [
                ValidationIssue(
                    severity=ValidationSeverity.warning,
                    code="wrong_pillar_count",
                    message=f"Pyramid has {len(data.pillars)} pillars; the template supports {PYRAMID_MIN_PILLARS}-{PYRAMID_MAX_PILLARS}.",
                )
            ]
        return []

    if isinstance(data, InfographicTimeline):
        if not (TIMELINE_MIN_MILESTONES <= len(data.milestones) <= TIMELINE_MAX_MILESTONES):
            return [
                ValidationIssue(
                    severity=ValidationSeverity.warning,
                    code="wrong_milestone_count",
                    message=f"Timeline has {len(data.milestones)} milestones; the template supports {TIMELINE_MIN_MILESTONES}-{TIMELINE_MAX_MILESTONES}.",
                )
            ]
        return []

    if isinstance(data, BulletSummarySlide):
        if not (BULLET_MIN_COUNT <= len(data.bullets) <= BULLET_MAX_COUNT):
            return [
                ValidationIssue(
                    severity=ValidationSeverity.warning,
                    code="wrong_bullet_count",
                    message=f"Summary has {len(data.bullets)} bullets; the template supports {BULLET_MIN_COUNT}-{BULLET_MAX_COUNT}.",
                )
            ]
        return []

    if isinstance(data, InfographicMatrix):
        if len(data.quadrants) != MATRIX_QUADRANT_COUNT:
            return [
                ValidationIssue(
                    severity=ValidationSeverity.warning,
                    code="wrong_quadrant_count",
                    message=f"Matrix has {len(data.quadrants)} quadrants; the template has exactly {MATRIX_QUADRANT_COUNT}.",
                )
            ]
        return []

    return []


@router.post("/infographic/export")
async def export_infographic_pptx(data: InfographicDiagram) -> Response:
    builder, filename = _EXPORT_BUILDERS[data.template]
    pptx_bytes = builder(data)
    return Response(
        content=pptx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/infographic/deck/export")
async def export_deck_pptx(slides: list[InfographicDiagram]) -> Response:
    pptx_bytes = build_deck_pptx(slides)
    return Response(
        content=pptx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": 'attachment; filename="infographic-deck.pptx"'},
    )


@router.websocket("/ws/generate-infographic")
async def generate_infographic_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            try:
                request = GenerateRequest.model_validate(payload)
            except ValidationError as exc:
                await websocket.send_json({"stage": "error", "message": str(exc)})
                continue

            await websocket.send_json({"stage": "classifying"})
            try:
                classification = await classify_infographic_template(request.material, request.prompt)
            except OpenAIError as exc:
                await websocket.send_json(
                    {"stage": "error", "message": f"OpenAI request failed: {exc}"}
                )
                continue

            await websocket.send_json({"stage": "calling_llm"})
            try:
                diagram = await generate_infographic(
                    classification.template, request.material, request.prompt
                )
            except OpenAIError as exc:
                await websocket.send_json(
                    {"stage": "error", "message": f"OpenAI request failed: {exc}"}
                )
                continue

            await websocket.send_json({"stage": "validating"})
            issues = _validate_infographic(diagram)

            response = GenerateInfographicResponse(diagram=diagram, issues=issues)
            await websocket.send_json({"stage": "done", "result": response.model_dump()})
    except WebSocketDisconnect:
        return


@router.websocket("/ws/generate-deck")
async def generate_deck_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            try:
                request = GenerateRequest.model_validate(payload)
            except ValidationError as exc:
                await websocket.send_json({"stage": "error", "message": str(exc)})
                continue

            await websocket.send_json({"stage": "planning"})
            try:
                plan = await plan_deck(request.material, request.prompt)
            except OpenAIError as exc:
                await websocket.send_json(
                    {"stage": "error", "message": f"OpenAI request failed: {exc}"}
                )
                continue

            if not plan.slides:
                await websocket.send_json(
                    {"stage": "error", "message": "The plan produced no slides."}
                )
                continue

            await websocket.send_json({"stage": "plan_ready", "plan": plan.model_dump()})

            async def on_slide_done(completed: int, total: int) -> None:
                await websocket.send_json(
                    {"stage": "generating", "completed": completed, "total": total}
                )

            try:
                slides = await generate_deck(request.material, request.prompt, plan, on_slide_done)
            except OpenAIError as exc:
                await websocket.send_json(
                    {"stage": "error", "message": f"OpenAI request failed: {exc}"}
                )
                continue

            issues: list[ValidationIssue] = []
            for slide in slides:
                issues.extend(_validate_infographic(slide))

            response = GenerateDeckResponse(title=plan.deck_title, slides=slides, issues=issues)
            await websocket.send_json({"stage": "done", "result": response.model_dump()})
    except WebSocketDisconnect:
        return
