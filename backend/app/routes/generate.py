from fastapi import APIRouter, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from openai import OpenAIError
from pydantic import ValidationError

from app.extraction import extract_text
from app.llm import generate_diagram
from app.models import ExtractResponse, GenerateRequest, GenerateResponse
from app.validation import validate_diagram

router = APIRouter(prefix="/api")


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/extract", response_model=ExtractResponse)
async def extract(file: UploadFile) -> ExtractResponse:
    text = await extract_text(file)
    return ExtractResponse(text=text, filename=file.filename or "")


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest) -> GenerateResponse:
    try:
        diagram = await generate_diagram(request.material, request.prompt)
    except OpenAIError as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {exc}") from exc

    issues = validate_diagram(diagram)
    return GenerateResponse(diagram=diagram, issues=issues)


@router.websocket("/ws/generate")
async def generate_ws(websocket: WebSocket) -> None:
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
                diagram = await generate_diagram(request.material, request.prompt)
            except OpenAIError as exc:
                await websocket.send_json(
                    {"stage": "error", "message": f"OpenAI request failed: {exc}"}
                )
                continue

            await websocket.send_json({"stage": "validating"})
            issues = validate_diagram(diagram)

            response = GenerateResponse(diagram=diagram, issues=issues)
            await websocket.send_json({"stage": "done", "result": response.model_dump()})
    except WebSocketDisconnect:
        return
