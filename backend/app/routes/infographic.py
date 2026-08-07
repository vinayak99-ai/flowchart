from fastapi import APIRouter, Response, WebSocket, WebSocketDisconnect
from openai import OpenAIError
from pydantic import ValidationError

from app.infographic_llm import classify_infographic_template, generate_infographic
from app.infographic_models import (
    COMPARISON_MAX_COLUMNS,
    GenerateInfographicResponse,
    InfographicComparison,
    InfographicDiagram,
    InfographicWheel,
    WHEEL_ITEM_COUNT,
)
from app.infographic_template import build_comparison_pptx, build_wheel_pptx
from app.models import GenerateRequest, ValidationIssue, ValidationSeverity

router = APIRouter(prefix="/api")


def _validate_infographic(data: InfographicWheel | InfographicComparison) -> list[ValidationIssue]:
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

    if not data.columns or len(data.columns) > COMPARISON_MAX_COLUMNS:
        return [
            ValidationIssue(
                severity=ValidationSeverity.warning,
                code="wrong_column_count",
                message=f"Comparison has {len(data.columns)} columns; the template supports up to {COMPARISON_MAX_COLUMNS}.",
            )
        ]
    return []


@router.post("/infographic/export")
async def export_infographic_pptx(data: InfographicDiagram) -> Response:
    if isinstance(data, InfographicWheel):
        pptx_bytes = build_wheel_pptx(data)
        filename = "infographic-wheel.pptx"
    else:
        pptx_bytes = build_comparison_pptx(data)
        filename = "infographic-comparison.pptx"
    return Response(
        content=pptx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
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
