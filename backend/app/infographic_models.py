from pydantic import BaseModel, Field

from app.models import ValidationIssue

WHEEL_ITEM_COUNT = 5


class WheelItem(BaseModel):
    label: str
    description: str


class InfographicWheel(BaseModel):
    title: str
    items: list[WheelItem] = Field(default_factory=list)


class GenerateInfographicResponse(BaseModel):
    diagram: InfographicWheel
    issues: list[ValidationIssue] = Field(default_factory=list)
