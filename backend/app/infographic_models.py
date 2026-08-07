from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.models import ValidationIssue

WHEEL_ITEM_COUNT = 5
COMPARISON_MIN_COLUMNS = 2
COMPARISON_MAX_COLUMNS = 4
COMPARISON_POINT_COUNT = 4

InfographicTemplateId = Literal["radial_wheel", "comparison_columns"]


class WheelItem(BaseModel):
    label: str
    description: str


class InfographicWheel(BaseModel):
    template: Literal["radial_wheel"] = "radial_wheel"
    title: str
    items: list[WheelItem] = Field(default_factory=list)


class ComparisonColumn(BaseModel):
    heading: str
    points: list[str] = Field(default_factory=list)


class InfographicComparison(BaseModel):
    template: Literal["comparison_columns"] = "comparison_columns"
    title: str
    columns: list[ComparisonColumn] = Field(default_factory=list)


# Tagged on `template` so a single LLM call's output (and the export request
# body) can be either shape without the caller needing to know which one
# up front -- the classify step below is what picks it.
InfographicDiagram = Annotated[
    InfographicWheel | InfographicComparison, Field(discriminator="template")
]


class GenerateInfographicResponse(BaseModel):
    diagram: InfographicDiagram
    issues: list[ValidationIssue] = Field(default_factory=list)
