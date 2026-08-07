from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import get_settings
from app.infographic_models import (
    COMPARISON_MAX_COLUMNS,
    COMPARISON_MIN_COLUMNS,
    COMPARISON_POINT_COUNT,
    PYRAMID_MAX_PILLARS,
    PYRAMID_MIN_PILLARS,
    ROADMAP_COLUMN_COUNT,
    ROADMAP_ITEM_COUNT,
    TIMELINE_MAX_MILESTONES,
    TIMELINE_MIN_MILESTONES,
    InfographicComparison,
    InfographicPyramid,
    InfographicRoadmap,
    InfographicTemplateId,
    InfographicTimeline,
    InfographicWheel,
    WHEEL_ITEM_COUNT,
)

CLASSIFY_SYSTEM_PROMPT = """You are an infographic designer for a product management tool. \
Given source material and a user prompt, decide which fixed-layout infographic template best \
fits the content, before anything is generated.

Templates:
- radial_wheel: a single central theme with exactly 5 co-equal facets, stages, or pillars \
arranged around it (e.g. a 5-step process, the 5 pillars of a strategy). Best when the items \
are parts of one whole, not alternatives or a time-ordered sequence.
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

Pick the single best-fitting template. If the material doesn't clearly fit any of them, prefer \
whichever one loses the least information.
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


async def generate_infographic(
    template: InfographicTemplateId, material: str, prompt: str
) -> InfographicWheel | InfographicComparison | InfographicRoadmap | InfographicPyramid | InfographicTimeline:
    if template == "comparison_columns":
        return await generate_infographic_comparison(material, prompt)
    if template == "now_next_later":
        return await generate_infographic_roadmap(material, prompt)
    if template == "vision_pyramid":
        return await generate_infographic_pyramid(material, prompt)
    if template == "quarterly_timeline":
        return await generate_infographic_timeline(material, prompt)
    return await generate_infographic_wheel(material, prompt)
