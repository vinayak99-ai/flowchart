from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.models import ValidationIssue

WHEEL_ITEM_COUNT = 5
COMPARISON_MIN_COLUMNS = 2
COMPARISON_MAX_COLUMNS = 4
COMPARISON_POINT_COUNT = 4
ROADMAP_COLUMN_COUNT = 3
ROADMAP_ITEM_COUNT = 5
PYRAMID_MIN_PILLARS = 3
PYRAMID_MAX_PILLARS = 4
TIMELINE_MIN_MILESTONES = 4
TIMELINE_MAX_MILESTONES = 6
BULLET_MIN_COUNT = 3
BULLET_MAX_COUNT = 6
MATRIX_QUADRANT_COUNT = 4
MATRIX_ITEM_COUNT = 4
DECK_MIN_SLIDES = 4
DECK_MAX_SLIDES = 10

InfographicTemplateId = Literal[
    "radial_wheel",
    "comparison_columns",
    "now_next_later",
    "vision_pyramid",
    "quarterly_timeline",
    "bullet_summary",
    "matrix_2x2",
]


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


class RoadmapColumn(BaseModel):
    heading: str
    items: list[str] = Field(default_factory=list)


class InfographicRoadmap(BaseModel):
    """A Now/Next/Later roadmap: 3 fixed time-horizon columns, closer-term
    horizons rendered visually stronger than farther-out ones."""

    template: Literal["now_next_later"] = "now_next_later"
    title: str
    columns: list[RoadmapColumn] = Field(default_factory=list)


class PyramidPillar(BaseModel):
    label: str
    description: str


class InfographicPyramid(BaseModel):
    """A vision/strategy pyramid: one apex vision statement over 3-4
    supporting pillar bands, widening toward the base."""

    template: Literal["vision_pyramid"] = "vision_pyramid"
    vision: str
    pillars: list[PyramidPillar] = Field(default_factory=list)


class TimelineMilestone(BaseModel):
    period: str
    label: str
    description: str


class InfographicTimeline(BaseModel):
    template: Literal["quarterly_timeline"] = "quarterly_timeline"
    title: str
    milestones: list[TimelineMilestone] = Field(default_factory=list)


class BulletSummarySlide(BaseModel):
    """The fallback shape for content that doesn't fit any of the other
    fixed-layout templates: a plain title + bullet list."""

    template: Literal["bullet_summary"] = "bullet_summary"
    title: str
    bullets: list[str] = Field(default_factory=list)


class MatrixQuadrant(BaseModel):
    label: str
    items: list[str] = Field(default_factory=list)


class InfographicMatrix(BaseModel):
    """A 2x2 grid -- flexible enough for a prioritization matrix (continuous
    axes like Impact/Effort) or a SWOT-style analysis (categorical axes).
    Quadrants are always ordered top-left, top-right, bottom-left,
    bottom-right."""

    template: Literal["matrix_2x2"] = "matrix_2x2"
    title: str
    x_axis_label: str
    y_axis_label: str
    quadrants: list[MatrixQuadrant] = Field(default_factory=list)


# Tagged on `template` so a single LLM call's output (and the export request
# body) can be any of these shapes without the caller needing to know which
# one up front -- the classify step is what picks it.
InfographicDiagram = Annotated[
    InfographicWheel
    | InfographicComparison
    | InfographicRoadmap
    | InfographicPyramid
    | InfographicTimeline
    | BulletSummarySlide
    | InfographicMatrix,
    Field(discriminator="template"),
]


class GenerateInfographicResponse(BaseModel):
    diagram: InfographicDiagram
    issues: list[ValidationIssue] = Field(default_factory=list)


class DeckSlidePlan(BaseModel):
    template: InfographicTemplateId
    topic: str


class DeckPlan(BaseModel):
    deck_title: str
    slides: list[DeckSlidePlan] = Field(default_factory=list)


class GenerateDeckResponse(BaseModel):
    title: str
    slides: list[InfographicDiagram] = Field(default_factory=list)
    issues: list[ValidationIssue] = Field(default_factory=list)
