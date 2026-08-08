from __future__ import annotations

from pydantic import BaseModel, Field

PERSONA_MIN_COUNT = 1
PERSONA_MAX_COUNT = 3
PROBLEM_STATEMENT_MAX_COUNT = 3
HMW_MIN_COUNT = 5
HMW_MAX_COUNT = 8
CONCEPT_SPARK_MIN_COUNT = 6
CONCEPT_SPARK_MAX_COUNT = 10
CONCEPT_BRIEF_MAX_COUNT = 3


class Voice(BaseModel):
    """A real quote or input from a named colleague/role the PM actually
    talked to -- the honest version of "collaboration" for a tool with no
    live multiplayer: makes it visible a persona isn't one person's guess."""

    name: str
    role: str
    input: str


class Persona(BaseModel):
    name: str
    context: str
    goals: list[str] = Field(default_factory=list)
    pains: list[str] = Field(default_factory=list)
    behaviors: list[str] = Field(default_factory=list)
    voices: list[Voice] = Field(default_factory=list)


class ProblemStatement(BaseModel):
    """A Point-of-View statement, assembled as one sentence the way
    positioning_statement does -- reads as a claim, not a filled-in form."""

    persona_name: str
    user: str
    need: str
    insight: str
    assembled: str


class HowMightWe(BaseModel):
    question: str
    rationale: str
    selected: bool = False


class ConceptSpark(BaseModel):
    """One quick, deliberately wide idea -- divergent thinking made visible
    as a step, not skipped straight to a single fleshed-out concept."""

    how_might_we: str
    idea: str
    is_wildcard: bool = False
    selected: bool = False


class ConceptBrief(BaseModel):
    """A narrowed concept, expanded from a selected spark, with the
    assumptions/risks that have to hold for it to work -- critical thinking
    captured at the point of choosing, not as an afterthought."""

    concept_name: str
    description: str
    key_interactions: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    biggest_risk: str


class ValidationPlan(BaseModel):
    concept_name: str
    hypotheses: list[str] = Field(default_factory=list)
    success_signal: str
    risk_if_wrong: str


class DesignThinkingSession(BaseModel):
    problem_area: str
    personas: list[Persona] = Field(default_factory=list)
    problem_statements: list[ProblemStatement] = Field(default_factory=list)
    how_might_we: list[HowMightWe] = Field(default_factory=list)
    concept_sparks: list[ConceptSpark] = Field(default_factory=list)
    concept_briefs: list[ConceptBrief] = Field(default_factory=list)
    validation_plans: list[ValidationPlan] = Field(default_factory=list)


# ---------- Stage request/response shapes ----------


class EmpathizeRequest(BaseModel):
    material: str
    prompt: str = ""


class EmpathizeResponse(BaseModel):
    personas: list[Persona] = Field(default_factory=list)


class DefineRequest(BaseModel):
    personas: list[Persona]
    prompt: str = ""


class DefineResponse(BaseModel):
    problem_statements: list[ProblemStatement] = Field(default_factory=list)


class IdeateHmwRequest(BaseModel):
    problem_statements: list[ProblemStatement]
    prompt: str = ""


class IdeateHmwResponse(BaseModel):
    how_might_we: list[HowMightWe] = Field(default_factory=list)


class IdeateSparksRequest(BaseModel):
    how_might_we: list[HowMightWe]
    prompt: str = ""


class IdeateSparksResponse(BaseModel):
    concept_sparks: list[ConceptSpark] = Field(default_factory=list)


class PrototypeRequest(BaseModel):
    concept_sparks: list[ConceptSpark]
    prompt: str = ""


class PrototypeResponse(BaseModel):
    concept_briefs: list[ConceptBrief] = Field(default_factory=list)


class TestRequest(BaseModel):
    concept_briefs: list[ConceptBrief]
    prompt: str = ""


class TestResponse(BaseModel):
    validation_plans: list[ValidationPlan] = Field(default_factory=list)
