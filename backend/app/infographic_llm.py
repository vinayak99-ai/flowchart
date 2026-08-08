import asyncio
from typing import Awaitable, Callable

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import get_settings
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
    TIMELINE_MAX_MILESTONES,
    TIMELINE_MIN_MILESTONES,
    BulletSummarySlide,
    DeckPlan,
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
- bullet_summary: a plain title + a short bullet list. Use this whenever content doesn't \
cleanly fit any of the shaped templates above -- it's the flexible fallback, not a last resort \
to avoid; forcing a poor fit into a shaped template is worse than a clean bullet list."""

CLASSIFY_SYSTEM_PROMPT = f"""You are an infographic designer for a product management tool. \
Given source material and a user prompt, decide which fixed-layout infographic template best \
fits the content, before anything is generated.

Templates:
{TEMPLATE_CATALOG}

Pick the single best-fitting template. If the material doesn't clearly fit one of the shaped \
templates, use bullet_summary rather than forcing a poor fit.
"""


class TemplateClassification(BaseModel):
    template: InfographicTemplateId
    reason: str


async def classify_infographic_template(material: str, prompt: str) -> TemplateClassification:
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": CLASSIFY_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=TemplateClassification,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed classification.")
    return parsed


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
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": WHEEL_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=InfographicWheel,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed infographic.")
    return parsed


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
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": COMPARISON_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=InfographicComparison,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed comparison.")
    return parsed


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
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": ROADMAP_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=InfographicRoadmap,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed roadmap.")
    return parsed


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
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": PYRAMID_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=InfographicPyramid,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed pyramid.")
    return parsed


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
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": TIMELINE_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=InfographicTimeline,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed timeline.")
    return parsed


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
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": BULLET_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=BulletSummarySlide,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed summary.")
    return parsed


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
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": MATRIX_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=InfographicMatrix,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed matrix.")
    return parsed


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
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": STORY_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=FeatureStory,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed story.")
    return parsed


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
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": HUB_SPOKE_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=InfographicHubSpoke,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed hub-and-spoke.")
    return parsed


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
- Each slide needs a `template` (one of the ids above) and a `topic`: a short, specific \
description of what that slide should cover (e.g. "Q1-Q3 rollout phases with dates"), detailed \
enough that a separate step can generate that slide's content from just this topic plus the \
full document.
- Use bullet_summary for any section worth a slide that doesn't cleanly fit a shaped template. \
Don't force content into the wrong shape.
- Hard floor and ceiling, regardless of the above: never fewer than {DECK_MIN_SLIDES} slides or \
more than {DECK_MAX_SLIDES}.
"""


async def plan_deck(material: str, prompt: str) -> DeckPlan:
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source document:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": PLAN_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=DeckPlan,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed deck plan.")
    return parsed


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
    total = len(plan.slides)
    tasks = [
        asyncio.ensure_future(
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
