from app.llm_client import generate_structured
from app.sequence_models import SequenceDiagram

SEQUENCE_SYSTEM_PROMPT = """You are a sequence diagram architect. Given source material and a user \
prompt, derive a structured sequence diagram as JSON matching the provided schema.

Rules:
- Every participant needs a short, unique `id` (slug-like, no spaces) and a concise human-readable \
`label`. List participants in the order they should appear left-to-right -- typically the order \
they first act in the material.
- Every message needs a unique `id`, a `source` and `target` participant id, a concise `label` \
describing what's being communicated, and a `type`: "sync" for a call or request, "return" for a \
response or reply to an earlier call.
- List messages in strict chronological order -- the order of the `messages` array IS the sequence.
- A participant doing internal work (not communicating with another participant) is a message where \
`source` and `target` are the same participant id.
- Do not invent interactions that aren't implied by the source material or prompt.
- Keep labels concise (ideally under 6 words).
"""


async def generate_sequence_diagram(material: str, prompt: str) -> SequenceDiagram:
    user_message = f"Source material:\n{material}\n\nInstructions:\n{prompt}"
    return await generate_structured(SEQUENCE_SYSTEM_PROMPT, user_message, SequenceDiagram)
