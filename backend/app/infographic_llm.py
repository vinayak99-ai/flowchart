from openai import AsyncOpenAI

from app.config import get_settings
from app.infographic_models import InfographicWheel, WHEEL_ITEM_COUNT

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
