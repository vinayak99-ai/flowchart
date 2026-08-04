from openai import AsyncOpenAI

from app.config import get_settings
from app.models import FlowchartDiagram

SYSTEM_PROMPT = """You are a flowchart architect. Given source material and a user prompt, \
derive a structured flowchart/journey model as JSON matching the provided schema.

Rules:
- Every node needs a short, unique `id` (slug-like, no spaces), a `type` \
(start, end, process, decision, io, or subprocess), and a concise human-readable `label`.
- Exactly one node should have type "start" and at least one node should have type "end", \
unless the material genuinely describes a cyclical process with no clear end.
- Every edge needs a unique `id`, and `source`/`target` that reference existing node ids.
- Use edge type "conditional" for edges leaving a decision node, and set a short `label` \
on those edges (e.g. "Yes" / "No") describing the branch condition.
- Group related nodes under a `DiagramGroup` (with its own `id` and `label`) when the \
material implies distinct phases, actors, or swimlanes; set `group_id` on member nodes. \
Omit groups entirely if there is no natural grouping.
- Do not invent steps that aren't implied by the source material or prompt.
- Keep labels concise (ideally under 8 words).
"""


async def generate_diagram(material: str, prompt: str) -> FlowchartDiagram:
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"

    completion = await client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format=FlowchartDiagram,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise ValueError("OpenAI response did not include a parsed diagram.")
    return parsed
