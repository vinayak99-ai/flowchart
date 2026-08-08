from __future__ import annotations

import asyncio
from typing import Awaitable, Callable

from pydantic import BaseModel

from app.llm_client import generate_structured
from app.infographic_models import (
    BULLET_MAX_COUNT,
    BULLET_MIN_COUNT,
    COMPARISON_MAX_COLUMNS,
    COMPARISON_MIN_COLUMNS,
    COMPARISON_POINT_COUNT,
    DECK_MAX_SLIDES,
    DECK_MIN_SLIDES,
    MATRIX_ITEM_COUNT,
    MATRIX_QUADRANT_COUNT,
    PYRAMID_MAX_PILLARS,
    PYRAMID_MIN_PILLARS,
    ROADMAP_COLUMN_COUNT,
    ROADMAP_ITEM_COUNT,
    RACI_MAX_ROWS,
    RACI_MIN_ROWS,
    NORTH_STAR_MAX_DRIVERS,
    NORTH_STAR_MIN_DRIVERS,
    TIMELINE_MAX_MILESTONES,
    TIMELINE_MIN_MILESTONES,
    TITLE_HIGHLIGHT_MAX,
    TITLE_HIGHLIGHT_MIN,
    VALUE_PROP_MAX_ITEMS,
    AgendaItem,
    AgendaSlide,
    BulletSummarySlide,
    DeckPlan,
    DeckSlidePlan,
    FeatureStory,
    HUB_SPOKE_ITEM_COUNT,
    InfographicComparison,
    InfographicDiagram,
    InfographicHubSpoke,
    InfographicMatrix,
    InfographicPyramid,
    InfographicRoadmap,
    InfographicTemplateId,
    InfographicTimeline,
    InfographicWheel,
    NorthStarMetricSlide,
    PositioningStatementSlide,
    RaciChartSlide,
    TitleSlide,
    ValuePropositionSlide,
    WHEEL_ITEM_COUNT,
)

TEMPLATE_CATALOG = """- radial_wheel: a single central theme with exactly 5 co-equal facets, stages, or pillars \
arranged around it (e.g. a 5-step process, the 5 pillars of a strategy). Best when the items \
are parts of one whole, not alternatives or a time-ordered sequence.
- hub_spoke: a single central theme with exactly 6 co-equal facets in two side columns (3 left, \
3 right). Same idea as radial_wheel but for 6 items instead of 5 -- use this instead of \
radial_wheel when the material naturally has 6 parts, not 5.
- comparison_columns: 2 to 4 options, plans, or approaches that should be compared side by \
side (e.g. pricing tiers, before vs after, competing strategies). Best when the content is \
naturally structured as parallel alternatives a reader chooses between.
- now_next_later: a product roadmap grouped into three time horizons -- what's shipping now, \
what's next, and what's further out -- without specific dates. Best for roadmap content that \
isn't tied to particular quarters or dates.
- vision_pyramid: one vision or mission statement supported by 3-4 strategic pillars/themes. \
Best for strategy or "why we exist" content, not for listing individual features or tasks.
- quarterly_timeline: 4-6 dated milestones along a single timeline (quarters, months, or named \
phases with dates). Best when the material gives specific time markers for each item, unlike \
now_next_later which has no dates.
- matrix_2x2: content that sorts into a 2x2 grid along two axes -- either a continuous scale \
(e.g. Impact vs Effort for prioritization) or a categorical split (e.g. a SWOT analysis: \
Strengths/Weaknesses/Opportunities/Threats). Best when the material is naturally comparing \
items along two dimensions at once, not just listing or sequencing them.
- feature_story: the narrative of ONE specific feature or epic -- the problem it solves, what \
was built, and the business impact delivered -- as a causal Problem -> Solution -> Impact arc. \
Best for a stakeholder update on a single piece of work, not a roadmap of multiple initiatives \
(now_next_later) or a comparison of options (comparison_columns).
- value_proposition: a Value Proposition Canvas -- the customer's jobs/pains/gains mapped \
against the product's offerings/pain-relievers/gain-creators. Best when the material argues the \
product's business value by showing which customer need each part of it answers, not just a \
number.
- positioning_statement: the classic elevator-pitch mad-lib ("For [customer] who [need], \
[product] is a [category] that [benefit]. Unlike [alternative], we [differentiator].") for the \
WHOLE product, not one feature. Best when the material describes market positioning, a target \
customer, or a competitive differentiator for the product as a whole.
- raci_chart: who owns what for an initiative -- one row per task with a Responsible/ \
Accountable/Consulted/Informed name in each column. Best when the material assigns ownership or \
decision rights, not when it's just describing what will be built.
- north_star_metric: the North Star Metric framework -- one metric that best captures the core \
value the product delivers to customers, plus the 3-5 input/driver metrics a team actually tracks \
to move it. Best when the material discusses success metrics, KPIs, or how a product/feature's \
impact is measured, not when it's describing what will be built or a general business outcome \
with no named metric.
- bullet_summary: a plain title + a short bullet list. Use this whenever content doesn't \
cleanly fit any of the shaped templates above -- it's the flexible fallback, not a last resort \
to avoid; forcing a poor fit into a shaped template is worse than a clean bullet list."""

CLASSIFY_SYSTEM_PROMPT = f"""You are an infographic designer for a product management tool. \
Given source material and a user prompt, decide which fixed-layout infographic template best \
fits the content, before anything is generated.

Templates:
{TEMPLATE_CATALOG}
- title_intro: a cover/title slide introducing the product or initiative itself -- a headline \
name, a one-line description of what it is, and a few short capability/pillar tags. Use this \
only when the user is explicitly asking for an intro/cover/title slide, not for summarizing one \
section of content.

Pick the single best-fitting template. If the material doesn't clearly fit one of the shaped \
templates, use bullet_summary rather than forcing a poor fit. Never pick agenda here -- it only \
makes sense once the rest of a deck's slides (and their page numbers) already exist, which this \
single-slide path doesn't have.
"""


class TemplateClassification(BaseModel):
    template: InfographicTemplateId
    reason: str


async def classify_infographic_template(material: str, prompt: str) -> TemplateClassification:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(CLASSIFY_SYSTEM_PROMPT, user_message, TemplateClassification)


WHEEL_SYSTEM_PROMPT = f"""You are an infographic designer. Given source material and a user \
prompt, derive a 5-stage radial wheel infographic as JSON matching the provided schema.

Rules:
- `title` is a short 1-3 word name for the overall process (fits in a small circular hub).
- `items` must contain EXACTLY {WHEEL_ITEM_COUNT} entries, in the order they should read around \
the wheel (stage 1 first). This layout has a fixed 5-slot geometry -- do not return more or fewer.
- Each item's `label` is a short 1-2 word stage name (e.g. "Research", "Launch").
- Each item's `description` is one short sentence (under 12 words) explaining that stage.
- Base every stage on what the source material actually describes. Do not invent stages that \
aren't implied by the material or prompt.
"""


async def generate_infographic_wheel(material: str, prompt: str) -> InfographicWheel:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(WHEEL_SYSTEM_PROMPT, user_message, InfographicWheel)


COMPARISON_SYSTEM_PROMPT = f"""You are an infographic designer. Given source material and a user \
prompt, derive a side-by-side comparison infographic as JSON matching the provided schema.

Rules:
- `title` is a short 1-4 word name for what's being compared (e.g. "Pricing Plans", "Build vs Buy").
- `columns` must contain between {COMPARISON_MIN_COLUMNS} and {COMPARISON_MAX_COLUMNS} entries, \
left-to-right in the order they should read. Use exactly as many columns as the material \
describes real, distinct options for -- never pad with an invented option to reach the maximum.
- Each column's `heading` is a short 1-3 word name for that option (e.g. "Starter", "Enterprise").
- Each column's `points` contains up to {COMPARISON_POINT_COUNT} short bullet phrases (under 8 \
words each) describing that option, in comparable order across columns where the material allows \
it, so the columns read as a fair side-by-side comparison.
- Base everything on what the source material actually describes. Do not invent options that \
aren't implied by the material or prompt.
"""


async def generate_infographic_comparison(material: str, prompt: str) -> InfographicComparison:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(COMPARISON_SYSTEM_PROMPT, user_message, InfographicComparison)


ROADMAP_SYSTEM_PROMPT = f"""You are a product manager building a public/exec roadmap slide. \
Given source material and a user prompt, derive a Now/Next/Later roadmap as JSON matching the \
provided schema.

Rules:
- `title` is a short 1-5 word name for the roadmap (e.g. "2026 Platform Roadmap").
- `columns` must contain EXACTLY {ROADMAP_COLUMN_COUNT} entries, in this exact order with these \
exact headings: "Now", "Next", "Later". This layout has a fixed 3-column geometry.
- Each column's `items` contains up to {ROADMAP_ITEM_COUNT} short initiative names (under 8 \
words each, no dates -- that's what quarterly_timeline is for). "Now" is what's actively \
shipping or nearly done; "Next" is planned but not yet started; "Later" is directional/exploratory.
- Base everything on what the source material actually describes. Do not invent initiatives \
that aren't implied by the material or prompt. If the material doesn't clearly separate into \
three horizons, use your best judgment to bucket items by how far out they are.
"""


async def generate_infographic_roadmap(material: str, prompt: str) -> InfographicRoadmap:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(ROADMAP_SYSTEM_PROMPT, user_message, InfographicRoadmap)


PYRAMID_SYSTEM_PROMPT = f"""You are a product strategist building a vision/strategy pyramid \
slide. Given source material and a user prompt, derive a vision pyramid as JSON matching the \
provided schema.

Rules:
- `vision` is one short, inspiring sentence (under 20 words) stating the north-star vision or \
mission -- what success ultimately looks like, not a task or a feature.
- `pillars` must contain between {PYRAMID_MIN_PILLARS} and {PYRAMID_MAX_PILLARS} entries, the \
strategic pillars/themes that support the vision. Use exactly as many as the material clearly \
describes -- never pad with an invented pillar.
- Each pillar's `label` is a short 1-3 word name (e.g. "Developer Trust", "Global Scale").
- Each pillar's `description` is one short phrase (under 10 words) explaining that pillar.
- Base everything on what the source material actually describes. Do not invent a vision or \
pillars that aren't implied by the material or prompt.
"""


async def generate_infographic_pyramid(material: str, prompt: str) -> InfographicPyramid:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(PYRAMID_SYSTEM_PROMPT, user_message, InfographicPyramid)


TIMELINE_SYSTEM_PROMPT = f"""You are a product manager building a dated roadmap timeline slide. \
Given source material and a user prompt, derive a quarterly timeline as JSON matching the \
provided schema.

Rules:
- `title` is a short 1-5 word name for the timeline (e.g. "2026 Launch Timeline").
- `milestones` must contain between {TIMELINE_MIN_MILESTONES} and {TIMELINE_MAX_MILESTONES} \
entries, left-to-right in chronological order.
- Each milestone's `period` is a short date marker (e.g. "Q1 2026", "March", "Phase 1"). Only \
use this template if the material actually gives time markers like these -- otherwise \
now_next_later is the better fit.
- Each milestone's `label` is a short 1-4 word name for what happens at that point.
- Each milestone's `description` is one short phrase (under 10 words) with more detail.
- Base everything on what the source material actually describes. Do not invent milestones or \
dates that aren't implied by the material or prompt.
"""


async def generate_infographic_timeline(material: str, prompt: str) -> InfographicTimeline:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(TIMELINE_SYSTEM_PROMPT, user_message, InfographicTimeline)


BULLET_SYSTEM_PROMPT = f"""You are an infographic designer building a plain summary slide -- the \
flexible fallback used when content doesn't fit a more specific visual shape. Given source \
material and a user prompt, derive a title + bullet list as JSON matching the provided schema.

Rules:
- `title` is a short 1-6 word name for what this slide covers.
- `bullets` must contain between {BULLET_MIN_COUNT} and {BULLET_MAX_COUNT} entries, each a \
short phrase (under 14 words), in a sensible reading order.
- Base everything on what the source material actually describes. Do not invent points that \
aren't implied by the material or prompt.
"""


async def generate_infographic_bullets(material: str, prompt: str) -> BulletSummarySlide:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(BULLET_SYSTEM_PROMPT, user_message, BulletSummarySlide)


MATRIX_SYSTEM_PROMPT = f"""You are a product strategist building a 2x2 analysis matrix slide \
(e.g. an Impact/Effort prioritization matrix, or a SWOT analysis). Given source material and a \
user prompt, derive a 2x2 matrix as JSON matching the provided schema.

Rules:
- `title` is a short 1-5 word name for the matrix (e.g. "Prioritization Matrix", "SWOT Analysis").
- `x_axis_label` and `y_axis_label` are short 1-2 word names for the horizontal and vertical \
axes. These can be a continuous scale (e.g. "Effort" / "Impact") or a categorical split (e.g. \
"Helpful" / "Harmful" for a SWOT-style matrix) -- pick whichever framing fits the material.
- `quadrants` must contain EXACTLY {MATRIX_QUADRANT_COUNT} entries, in this exact order: \
top-left, top-right, bottom-left, bottom-right.
- Each quadrant's `label` is a short 2-5 word name for what that quadrant represents (e.g. \
"Quick Wins", "Strengths").
- Each quadrant's `items` contains up to {MATRIX_ITEM_COUNT} short phrases (under 8 words each).
- Base everything on what the source material actually describes. Do not invent items that \
aren't implied by the material or prompt.
"""


async def generate_infographic_matrix(material: str, prompt: str) -> InfographicMatrix:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(MATRIX_SYSTEM_PROMPT, user_message, InfographicMatrix)


STORY_SYSTEM_PROMPT = """You are a product manager telling the story of a specific feature or \
epic for a stakeholder update. Given source material and a user prompt, derive a \
Problem -> Solution -> Impact narrative as JSON matching the provided schema.

Rules:
- `headline` is one bold sentence stating the business value -- the line a skimming executive \
should remember (e.g. "Checkout redesign recovered $2.1M in annual revenue by cutting drop-off \
40%."). Lead with the outcome, not the feature name.
- `problem.heading` is a short 2-4 word label for this act (e.g. "The Problem"). `problem.body` \
is one sentence describing the pain point. `problem.detail` is a short supporting line -- \
who's affected and/or a quantifying stat, if the material provides one.
- `solution.heading` is a short label (e.g. "The Solution"). `solution.body` names the \
feature/epic and describes what it does in plain language, not a spec. `solution.detail` is \
the key capability or mechanism that made it work, in one short phrase.
- `impact.heading` is a short label (e.g. "The Impact"). `impact.body` is the measured or \
projected business outcome. `impact.detail` is which company goal/strategic priority this ties \
back to, or what it unlocks next.
- Base everything on what the source material actually describes. Do not invent metrics or \
outcomes that aren't implied by the material or prompt.
"""


async def generate_infographic_story(material: str, prompt: str) -> FeatureStory:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(STORY_SYSTEM_PROMPT, user_message, FeatureStory)


HUB_SPOKE_SYSTEM_PROMPT = f"""You are an infographic designer. Given source material and a user \
prompt, derive a 6-item hub-and-spoke infographic as JSON matching the provided schema.

Rules:
- `title` is a short 1-4 word name for the overall theme (fits in the central hub).
- `description` is one short sentence (under 20 words) elaborating on the hub theme, shown \
below the title inside the hub.
- `items` must contain EXACTLY {HUB_SPOKE_ITEM_COUNT} entries. This layout has a fixed 6-slot \
geometry -- do not return more or fewer. Order them: the first 3 render as the left column \
(top to bottom), the last 3 render as the right column (top to bottom).
- Each item's `label` is a short 1-3 word name for that facet/step.
- Each item's `description` is one short sentence (under 16 words) explaining it.
- Base every item on what the source material actually describes. Do not invent items that \
aren't implied by the material or prompt.
"""


async def generate_infographic_hub_spoke(material: str, prompt: str) -> InfographicHubSpoke:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(HUB_SPOKE_SYSTEM_PROMPT, user_message, InfographicHubSpoke)


TITLE_SYSTEM_PROMPT = f"""You are an infographic designer building the opening cover slide for a \
deck generated from a product document. Given source material and a user prompt, derive a title/ \
intro slide as JSON matching the provided schema.

Rules:
- `title` is the name of the product, initiative, or document itself (e.g. "Product Studio \
Platform Expansion"), not a generic label like "Introduction" or "Overview".
- `subtitle` is one sentence (under 25 words) stating what it is and why it matters -- the line \
someone reads if they read nothing else on this slide.
- `highlights` must contain between {TITLE_HIGHLIGHT_MIN} and {TITLE_HIGHLIGHT_MAX} short 1-3 \
word tags naming the core pillars, capabilities, or themes the rest of the material covers (e.g. \
"Speed", "Trust", "Breadth").
- Base everything on what the source material actually describes. Do not invent a name, claim, \
or pillar that isn't implied by the material or prompt.
"""


async def generate_infographic_title(material: str, prompt: str) -> TitleSlide:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(TITLE_SYSTEM_PROMPT, user_message, TitleSlide)


AGENDA_SYSTEM_PROMPT = """You are an infographic designer building a standalone table-of-contents \
slide (used outside full-deck generation, where page numbers are instead computed exactly from \
the real deck). Given source material and a user prompt, derive an agenda as JSON matching the \
provided schema.

Rules:
- `title` is "Agenda" unless the prompt asks for something else (e.g. "Table of Contents").
- `items` is an ordered list of the material's main sections, each a short 2-5 word label.
- Assign each item's `page` sequentially starting at 3 (page 1 is a title slide, page 2 is this \
agenda, by convention) -- this is a best-effort placeholder the PM can correct once the real \
deck exists, not a guarantee.
- Base everything on what the source material actually describes. Do not invent sections that \
aren't implied by the material or prompt.
"""


async def generate_infographic_agenda(material: str, prompt: str) -> AgendaSlide:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(AGENDA_SYSTEM_PROMPT, user_message, AgendaSlide)


VALUE_PROPOSITION_SYSTEM_PROMPT = f"""You are a product strategist building a Value Proposition \
Canvas (Osterwalder) to make the business case for a product. Given source material and a user \
prompt, derive a value proposition as JSON matching the provided schema.

Rules:
- `title` is a short 2-5 word name (e.g. "Value Proposition", "Why It Matters").
- `customer_jobs` (up to {VALUE_PROP_MAX_ITEMS}): what the customer is actually trying to get \
done -- tasks, goals, or problems they're solving, not features they've asked for.
- `customer_pains` (up to {VALUE_PROP_MAX_ITEMS}): the bad outcomes, risks, or frustrations the \
customer experiences today, before this product.
- `customer_gains` (up to {VALUE_PROP_MAX_ITEMS}): the outcomes and benefits the customer wants -- \
what success looks like to them.
- `products_services` (up to {VALUE_PROP_MAX_ITEMS}): the concrete parts of the product that \
address the jobs above.
- `pain_relievers` (up to {VALUE_PROP_MAX_ITEMS}): specifically how the product removes or eases \
each pain above -- these should map to `customer_pains`, not restate the product's features.
- `gain_creators` (up to {VALUE_PROP_MAX_ITEMS}): specifically how the product produces the gains \
above -- these should map to `customer_gains`.
- Keep every item short (under 10 words). Base everything on what the source material actually \
describes. Do not invent a job, pain, or gain that isn't implied by the material or prompt.
"""


async def generate_infographic_value_proposition(material: str, prompt: str) -> ValuePropositionSlide:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(VALUE_PROPOSITION_SYSTEM_PROMPT, user_message, ValuePropositionSlide)


POSITIONING_SYSTEM_PROMPT = """You are a product marketer writing the standard Geoffrey Moore \
positioning statement for a WHOLE product (not one feature). Given source material and a user \
prompt, derive the statement's slots as JSON matching the provided schema. The slots assemble \
into: "For [target_customer] who [need], [product_name] is a [category] that [key_benefit]. \
Unlike [primary_alternative], we [differentiator]."

Rules:
- `product_name` is the product's actual name.
- `target_customer` is a short noun phrase for who it's for (e.g. "product managers at growing \
teams"), not a full sentence.
- `need` completes "...who ___" -- the need or situation that makes this product relevant, in a \
few words, not a full sentence.
- `category` is the product category, a short noun phrase (e.g. "AI-assisted PM workspace").
- `key_benefit` completes "...that ___" -- the single main benefit, as a short phrase.
- `primary_alternative` is what people do today instead (a competitor, a manual process, or "the \
status quo") -- a short noun phrase.
- `differentiator` completes "...we ___" -- what specifically makes this product different from \
that alternative, as a short phrase.
- Every slot should read naturally as a continuation of the sentence template above -- write \
phrases, not full sentences, and don't restate words already in the template ("is a", "unlike", \
etc.) inside your slot values.
- Base everything on what the source material actually describes. Do not invent a claim that \
isn't implied by the material or prompt.
"""


async def generate_infographic_positioning(material: str, prompt: str) -> PositioningStatementSlide:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(POSITIONING_SYSTEM_PROMPT, user_message, PositioningStatementSlide)


RACI_SYSTEM_PROMPT = f"""You are a PM documenting decision rights for an initiative as a RACI \
chart. Given source material and a user prompt, derive the chart as JSON matching the provided \
schema.

Rules:
- `title` is a short 2-6 word name (e.g. "RACI: Platform Expansion").
- `rows` must contain between {RACI_MIN_ROWS} and {RACI_MAX_ROWS} entries, one per distinct task \
or decision the material assigns ownership for.
- Each row's `task` is a short 2-6 word name for that task/decision.
- `responsible` is who does the work; `accountable` is who owns the outcome (usually one person, \
even if `responsible` names a team); `consulted` is whose input is sought before acting; \
`informed` is who's kept in the loop after. Each is a short name, role, or team (e.g. "Eng team", \
"Dana (PM)") -- under 5 words.
- If the material doesn't name real people/teams for a role, use a role description instead of \
inventing a name (e.g. "Engineering lead", not a made-up person).
- Base everything on what the source material actually describes. Do not invent tasks or \
ownership that aren't implied by the material or prompt.
"""


async def generate_infographic_raci(material: str, prompt: str) -> RaciChartSlide:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(RACI_SYSTEM_PROMPT, user_message, RaciChartSlide)


NORTH_STAR_SYSTEM_PROMPT = f"""You are a product manager defining how success is measured, using \
the North Star Metric framework. Given source material and a user prompt, derive the metric tree \
as JSON matching the provided schema.

Rules:
- `north_star` is the single metric that best captures the core value the product delivers to \
customers -- not a vanity metric (e.g. total signups) or a pure revenue number, but something \
that moves only when customers are genuinely getting value (e.g. "Weekly Active Orders per \
User", not "Total Downloads"). Keep it short, 2-6 words.
- `definition` is one sentence explaining why this metric captures real customer value and how \
it's measured.
- `drivers` must contain between {NORTH_STAR_MIN_DRIVERS} and {NORTH_STAR_MAX_DRIVERS} entries -- \
the concrete input metrics a team actually pulls to move the north star. Use exactly as many as \
the material clearly supports -- never pad with an invented driver.
- Each driver's `label` is a short 2-4 word name for that input (e.g. "Order Frequency", \
"Activation Rate").
- Each driver's `metric` is the specific, measurable proxy for it (e.g. "Orders per active user \
per week"), under 8 words -- concrete enough that someone could actually instrument and track it.
- Each driver's `description` is one short sentence on how moving this metric moves the north star.
- Base everything on what the source material actually describes. Do not invent a metric or \
driver that isn't implied by the material or prompt.
"""


async def generate_infographic_north_star(material: str, prompt: str) -> NorthStarMetricSlide:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(NORTH_STAR_SYSTEM_PROMPT, user_message, NorthStarMetricSlide)


async def generate_infographic(
    template: InfographicTemplateId, material: str, prompt: str
) -> InfographicDiagram:
    if template == "comparison_columns":
        return await generate_infographic_comparison(material, prompt)
    if template == "now_next_later":
        return await generate_infographic_roadmap(material, prompt)
    if template == "vision_pyramid":
        return await generate_infographic_pyramid(material, prompt)
    if template == "quarterly_timeline":
        return await generate_infographic_timeline(material, prompt)
    if template == "bullet_summary":
        return await generate_infographic_bullets(material, prompt)
    if template == "matrix_2x2":
        return await generate_infographic_matrix(material, prompt)
    if template == "feature_story":
        return await generate_infographic_story(material, prompt)
    if template == "hub_spoke":
        return await generate_infographic_hub_spoke(material, prompt)
    if template == "title_intro":
        return await generate_infographic_title(material, prompt)
    if template == "agenda":
        return await generate_infographic_agenda(material, prompt)
    if template == "value_proposition":
        return await generate_infographic_value_proposition(material, prompt)
    if template == "positioning_statement":
        return await generate_infographic_positioning(material, prompt)
    if template == "raci_chart":
        return await generate_infographic_raci(material, prompt)
    if template == "north_star_metric":
        return await generate_infographic_north_star(material, prompt)
    return await generate_infographic_wheel(material, prompt)


PLAN_SYSTEM_PROMPT = f"""You are an infographic designer for a product management tool. Given a \
full document (e.g. a PRD) and a user prompt, plan a slide deck that turns the document into a \
sequence of infographic slides.

Available templates:
{TEMPLATE_CATALOG}

Rules:
- Decide the slide count from the document itself: how many genuinely distinct, decision-relevant \
sections does it actually contain? A short or thin document might only warrant {DECK_MIN_SLIDES} \
slides; a long, dense one might warrant {DECK_MAX_SLIDES}. The count should be a direct \
consequence of how much slide-worthy material is actually there -- don't pad thin content to \
fill out a range, and don't compress a rich document down to a round number just because it \
feels tidy.
- Pick the most information-dense, decision-relevant sections of the document -- vision, goals, \
roadmap, comparisons/options, key milestones, prioritized initiatives -- rather than mechanically \
producing one slide per heading. Skip filler content (revision history, boilerplate).
- `deck_title` is a short 2-6 word name for the whole deck.
- Plan CONTENT slides only. A title/cover slide and an agenda/table-of-contents slide are always \
added automatically before your first planned slide -- do not plan either of those yourself, and \
do not plan a redundant "Introduction" or "Overview" slide either, since the cover slide already \
covers that.
- Each slide needs a `template` (one of the ids above), a `topic` (a short, specific description \
of what that slide should cover, e.g. "Q1-Q3 rollout phases with dates", detailed enough that a \
separate step can generate that slide's content from just this topic plus the full document), \
and an `agenda_label` (a short 2-5 word line for this slide's row on the deck's agenda, e.g. \
"Q1-Q3 Rollout Plan" -- punchier and shorter than `topic`, written for a reader scanning a \
table of contents, not for the generation step).
- Use bullet_summary for any section worth a slide that doesn't cleanly fit a shaped template. \
Don't force content into the wrong shape.
- Hard floor and ceiling, regardless of the above: never fewer than {DECK_MIN_SLIDES} slides or \
more than {DECK_MAX_SLIDES} CONTENT slides (the automatic title and agenda slides are on top of \
this range, not counted within it).
"""


async def plan_deck(material: str, prompt: str) -> DeckPlan:
    user_message = f"Source document:\n{material}\n\nInstructions:\n{prompt}"
    parsed = await generate_structured(PLAN_SYSTEM_PROMPT, user_message, DeckPlan)

    # Every generated deck opens with a cover slide and an agenda, added
    # here in code rather than left to the planner LLM -- guarantees they're
    # always present, always first, and always in this order, which the
    # agenda's page numbers depend on (see generate_deck's agenda handling).
    opener = [
        DeckSlidePlan(
            template="title_intro",
            topic=(
                f"An introduction to '{parsed.deck_title}': what it is, who it's for, and its "
                "core value -- drawn from the document as a whole, not one section of it."
            ),
            agenda_label="Introduction",
        ),
        DeckSlidePlan(template="agenda", topic="Agenda", agenda_label="Agenda"),
    ]
    return DeckPlan(deck_title=parsed.deck_title, slides=opener + parsed.slides)


async def generate_deck_slide(material: str, prompt: str, template: InfographicTemplateId, topic: str) -> InfographicDiagram:
    """Generates one slide's content, reusing the same per-template generators
    as single-infographic generation -- the plan step only decides shape and
    topic, not content, so no new content-generation prompts are needed."""
    scoped_prompt = f"{prompt}\n\nThis slide should focus specifically on: {topic}"
    return await generate_infographic(template, material, scoped_prompt)


async def _generate_indexed_slide(
    i: int, material: str, prompt: str, template: InfographicTemplateId, topic: str
) -> tuple[int, InfographicDiagram]:
    diagram = await generate_deck_slide(material, prompt, template, topic)
    return i, diagram


def _build_agenda(plan: DeckPlan) -> AgendaSlide:
    """Builds the agenda directly from the plan instead of an LLM call --
    page numbers are just each OTHER slide's 1-based position in the final
    deck (title_intro/agenda excluded from their own listing), so this is
    exact by construction rather than a guess a model could get wrong."""
    items = [
        AgendaItem(label=slide_plan.agenda_label, page=i + 1)
        for i, slide_plan in enumerate(plan.slides)
        if slide_plan.template not in ("title_intro", "agenda")
    ]
    return AgendaSlide(title="Agenda", items=items)


async def _indexed_agenda(i: int, plan: DeckPlan) -> tuple[int, InfographicDiagram]:
    # No I/O -- wrapped as a coroutine purely so it can sit in the same
    # asyncio.as_completed pool as the real per-slide LLM calls below.
    return i, _build_agenda(plan)


async def generate_deck(
    material: str,
    prompt: str,
    plan: DeckPlan,
    on_slide_done: Callable[[int, int], Awaitable[None]] | None = None,
) -> list[InfographicDiagram]:
    # Independent per-slide calls, so they run concurrently rather than
    # paying N sequential round-trips for an N-slide deck. as_completed (not
    # gather) lets the caller report progress as each slide finishes; the
    # index is baked into each task's own return value (not looked up by
    # task identity afterward) since as_completed yields wrapper coroutines,
    # not the original task objects. Results are assembled back into the
    # original plan order -- slide order in the deck must match the plan,
    # not completion order.
    #
    # The agenda slide is the one exception: it's never an LLM call (see
    # _build_agenda) since its whole point -- correct page numbers -- comes
    # from the plan itself, not from asking a model to count slides it
    # can't see the final order of.
    total = len(plan.slides)
    tasks = [
        asyncio.ensure_future(_indexed_agenda(i, plan))
        if slide_plan.template == "agenda"
        else asyncio.ensure_future(
            _generate_indexed_slide(i, material, prompt, slide_plan.template, slide_plan.topic)
        )
        for i, slide_plan in enumerate(plan.slides)
    ]

    results: list[InfographicDiagram | None] = [None] * total
    completed = 0
    for task in asyncio.as_completed(tasks):
        i, diagram = await task
        results[i] = diagram
        completed += 1
        if on_slide_done:
            await on_slide_done(completed, total)

    return [slide for slide in results if slide is not None]
