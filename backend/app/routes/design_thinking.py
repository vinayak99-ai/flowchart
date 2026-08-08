from fastapi import APIRouter, HTTPException, Response
from openai import OpenAIError

from app.design_thinking_llm import (
    generate_concept_briefs,
    generate_concept_sparks,
    generate_how_might_we,
    generate_personas,
    generate_problem_statements,
    generate_validation_plans,
)
from app.design_thinking_markdown import build_design_thinking_markdown
from app.design_thinking_models import (
    DefineRequest,
    DefineResponse,
    DesignThinkingSession,
    EmpathizeRequest,
    EmpathizeResponse,
    IdeateHmwRequest,
    IdeateHmwResponse,
    IdeateSparksRequest,
    IdeateSparksResponse,
    PrototypeRequest,
    PrototypeResponse,
    TestRequest,
    TestResponse,
)

router = APIRouter(prefix="/api/design-thinking")


def _openai_error(exc: OpenAIError) -> HTTPException:
    return HTTPException(status_code=502, detail=f"OpenAI request failed: {exc}")


@router.post("/empathize", response_model=EmpathizeResponse)
async def api_empathize(request: EmpathizeRequest) -> EmpathizeResponse:
    try:
        return await generate_personas(request.material, request.prompt)
    except OpenAIError as exc:
        raise _openai_error(exc) from exc


@router.post("/define", response_model=DefineResponse)
async def api_define(request: DefineRequest) -> DefineResponse:
    try:
        return await generate_problem_statements(request.personas, request.prompt)
    except OpenAIError as exc:
        raise _openai_error(exc) from exc


@router.post("/ideate/how-might-we", response_model=IdeateHmwResponse)
async def api_ideate_hmw(request: IdeateHmwRequest) -> IdeateHmwResponse:
    try:
        return await generate_how_might_we(request.problem_statements, request.prompt)
    except OpenAIError as exc:
        raise _openai_error(exc) from exc


@router.post("/ideate/concept-sparks", response_model=IdeateSparksResponse)
async def api_ideate_sparks(request: IdeateSparksRequest) -> IdeateSparksResponse:
    selected = [h for h in request.how_might_we if h.selected]
    if not selected:
        raise HTTPException(status_code=400, detail="Select at least one How Might We question first.")
    try:
        return await generate_concept_sparks(selected, request.prompt)
    except OpenAIError as exc:
        raise _openai_error(exc) from exc


@router.post("/prototype", response_model=PrototypeResponse)
async def api_prototype(request: PrototypeRequest) -> PrototypeResponse:
    selected = [s for s in request.concept_sparks if s.selected]
    if not selected:
        raise HTTPException(status_code=400, detail="Select at least one concept spark first.")
    try:
        return await generate_concept_briefs(selected, request.prompt)
    except OpenAIError as exc:
        raise _openai_error(exc) from exc


@router.post("/test", response_model=TestResponse)
async def api_test(request: TestRequest) -> TestResponse:
    if not request.concept_briefs:
        raise HTTPException(status_code=400, detail="No concept briefs to validate yet.")
    try:
        return await generate_validation_plans(request.concept_briefs, request.prompt)
    except OpenAIError as exc:
        raise _openai_error(exc) from exc


@router.post("/export")
def api_export(session: DesignThinkingSession) -> Response:
    markdown = build_design_thinking_markdown(session)
    return Response(
        content=markdown,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="design-thinking.md"'},
    )
