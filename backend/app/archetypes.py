from enum import Enum

from pydantic import BaseModel


class ArchetypeId(str, Enum):
    linear = "linear"
    approval_gate = "approval_gate"
    validation_retry = "validation_retry"
    routing_decision = "routing_decision"
    fork_join = "fork_join"
    custom = "custom"


class Archetype(BaseModel):
    id: ArchetypeId
    name: str
    description: str
    shape_guidance: str


ARCHETYPES: dict[ArchetypeId, Archetype] = {
    ArchetypeId.linear: Archetype(
        id=ArchetypeId.linear,
        name="Linear process",
        description="A single straight chain of steps with no branching.",
        shape_guidance=(
            "Shape this as a single straight chain: one start node, a sequence of "
            "process/io/subprocess nodes where each has exactly one incoming and one "
            "outgoing edge, ending in one end node. Do not introduce any decision "
            "nodes or branches. If the material has 3-8 sequential steps, this is the "
            "right shape."
        ),
    ),
    ArchetypeId.approval_gate: Archetype(
        id=ArchetypeId.approval_gate,
        name="Approval gate",
        description="A linear lead-in that reaches a single decision with approve/reject branches.",
        shape_guidance=(
            "Shape this as a linear lead-in (start, then one or more process/io steps) "
            "that reaches exactly one decision node acting as an approval gate. The "
            "decision has exactly two outgoing conditional edges labeled for the "
            "approve path (e.g. 'Approved') and the reject path (e.g. 'Rejected'). "
            "Each branch leads to its own short tail of steps and its own end node "
            "(or both branches may converge to a single shared end node if the "
            "material implies the process concludes the same way either way). Do not "
            "add more than one decision node unless the material clearly describes a "
            "second, independent approval step."
        ),
    ),
    ArchetypeId.validation_retry: Archetype(
        id=ArchetypeId.validation_retry,
        name="Validation retry loop",
        description="A decision that can loop back to an earlier step until it passes.",
        shape_guidance=(
            "Shape this as a linear lead-in reaching a decision node that validates "
            "or checks something. On failure, route a conditional edge labeled "
            "'No' (or similar) back to the earlier step that should be retried, "
            "forming a cycle. On success, route a conditional edge labeled 'Yes' "
            "forward to the remaining steps and an end node. Only create this loop-back "
            "edge if the material genuinely implies retrying rather than branching to a "
            "different outcome."
        ),
    ),
    ArchetypeId.routing_decision: Archetype(
        id=ArchetypeId.routing_decision,
        name="Routing decision",
        description="A decision that fans out into several distinct downstream paths.",
        shape_guidance=(
            "Shape this as a linear lead-in reaching one decision node with three or "
            "more outgoing conditional edges, each labeled with the condition it "
            "represents (not just 'Yes'/'No'). Each branch leads to its own short "
            "sequence of steps. Branches may converge to a shared end node if the "
            "material implies a common conclusion, or each may end separately."
        ),
    ),
    ArchetypeId.fork_join: Archetype(
        id=ArchetypeId.fork_join,
        name="Fork / join",
        description="Parallel branches that split from one node and reconverge at another.",
        shape_guidance=(
            "Shape this as a lead-in that reaches a single process node acting as a "
            "fork point, from which two or more parallel branches of process/io steps "
            "run independently (no conditional labels needed, since these are parallel "
            "paths rather than alternatives), then reconverge into a single join node "
            "before the end. Only use this shape if the material genuinely describes "
            "work happening concurrently or independently, not a sequence of "
            "alternatives."
        ),
    ),
    ArchetypeId.custom: Archetype(
        id=ArchetypeId.custom,
        name="Custom",
        description="No canonical shape fits; let the structure follow the material directly.",
        shape_guidance="",
    ),
}
