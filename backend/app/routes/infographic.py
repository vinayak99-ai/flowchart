from fastapi import APIRouter, Response, WebSocket, WebSocketDisconnect
from openai import OpenAIError
from pydantic import ValidationError

from app.infographic_llm import generate_infographic_wheel
from app.infographic_models import GenerateInfographicResponse, InfographicWheel, WHEEL_ITEM_COUNT
from app.infographic_template import build_wheel_pptx
from app.models import GenerateRequest, ValidationIssue, ValidationSeverity

router = APIRouter(prefix="/api")


def _validate_wheel(data: InfographicWheel) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    if len(data.items) != WHEEL_ITEM_COUNT:
        issues.append(
            ValidationIssue(
                severity=ValidationSeverity.warning,
                code="wrong_item_count",
                message=f"Wheel has {len(data.items)} items; the template has exactly {WHEEL_ITEM_COUNT} slots.",
            )
        )
    return issues


@router.post("/infographic/wheel/export")
async def export_wheel_pptx(data: InfographicWheel) -> Response:
    pptx_bytes = build_wheel_pptx(data)
    return Response(
        content=pptx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": 'attachment; filename="infographic-wheel.pptx"'},
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

            await websocket.send_json({"stage": "calling_llm"})
            try:
                wheel = await generate_infographic_wheel(request.material, request.prompt)
            except OpenAIError as exc:
                await websocket.send_json(
                    {"stage": "error", "message": f"OpenAI request failed: {exc}"}
                )
                continue

            await websocket.send_json({"stage": "validating"})
            issues = _validate_wheel(wheel)

            response = GenerateInfographicResponse(diagram=wheel, issues=issues)
            await websocket.send_json({"stage": "done", "result": response.model_dump()})
    except WebSocketDisconnect:
        return
