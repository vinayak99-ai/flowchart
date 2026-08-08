from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

from app.archetypes import ArchetypeId


class NodeType(str, Enum):
    start = "start"
    end = "end"
    process = "process"
    decision = "decision"
    io = "io"
    subprocess = "subprocess"


class EdgeType(str, Enum):
    default = "default"
    conditional = "conditional"


class DiagramNode(BaseModel):
    id: str
    type: NodeType
    label: str
    group_id: str | None = None


class DiagramEdge(BaseModel):
    id: str
    source: str
    target: str
    type: EdgeType = EdgeType.default
    label: str | None = None


class DiagramGroup(BaseModel):
    id: str
    label: str


class FlowchartDiagram(BaseModel):
    nodes: list[DiagramNode] = Field(default_factory=list)
    edges: list[DiagramEdge] = Field(default_factory=list)
    groups: list[DiagramGroup] = Field(default_factory=list)


class ValidationSeverity(str, Enum):
    error = "error"
    warning = "warning"


class ValidationIssue(BaseModel):
    severity: ValidationSeverity
    code: str
    message: str
    node_id: str | None = None
    edge_id: str | None = None


class GenerateRequest(BaseModel):
    material: str
    prompt: str


class GenerateResponse(BaseModel):
    diagram: FlowchartDiagram
    issues: list[ValidationIssue] = Field(default_factory=list)
    archetype: ArchetypeId | None = None


class ExtractResponse(BaseModel):
    text: str
    filename: str
