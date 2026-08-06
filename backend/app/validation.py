import networkx as nx

from app.archetypes import ArchetypeId
from app.models import FlowchartDiagram, NodeType, ValidationIssue, ValidationSeverity


def _check_archetype_conformance(
    diagram: FlowchartDiagram, graph: nx.DiGraph, archetype: ArchetypeId
) -> list[ValidationIssue]:
    if archetype == ArchetypeId.custom:
        return []

    issues: list[ValidationIssue] = []
    decision_ids = [node.id for node in diagram.nodes if node.type == NodeType.decision]

    def mismatch(message: str) -> ValidationIssue:
        return ValidationIssue(
            severity=ValidationSeverity.warning,
            code="archetype_mismatch",
            message=message,
        )

    if archetype == ArchetypeId.linear:
        if decision_ids:
            issues.append(
                mismatch(
                    "Expected a linear chain with no decision nodes, but found "
                    f"{len(decision_ids)}."
                )
            )
        branching = [n for n in graph.nodes if graph.out_degree(n) > 1]
        if branching:
            issues.append(mismatch("Expected a linear chain, but some steps branch."))

    elif archetype == ArchetypeId.approval_gate:
        if len(decision_ids) != 1:
            issues.append(
                mismatch(
                    "Expected exactly one approval decision, but found "
                    f"{len(decision_ids)}."
                )
            )
        elif graph.out_degree(decision_ids[0]) != 2:
            issues.append(
                mismatch("Expected the approval decision to have exactly two branches.")
            )

    elif archetype == ArchetypeId.validation_retry:
        if not decision_ids:
            issues.append(mismatch("Expected a validation decision, but found none."))
        elif not any(nx.simple_cycles(graph)):
            issues.append(
                mismatch("Expected a retry loop back to an earlier step, but found none.")
            )

    elif archetype == ArchetypeId.routing_decision:
        if not decision_ids or not any(graph.out_degree(d) >= 3 for d in decision_ids):
            issues.append(
                mismatch(
                    "Expected a decision fanning out into three or more paths, but found none."
                )
            )

    elif archetype == ArchetypeId.fork_join:
        has_fork = any(graph.out_degree(n) >= 2 for n in graph.nodes)
        has_join = any(graph.in_degree(n) >= 2 for n in graph.nodes)
        if not (has_fork and has_join):
            issues.append(
                mismatch("Expected parallel branches that fork and rejoin, but found none.")
            )

    return issues


def validate_diagram(
    diagram: FlowchartDiagram, archetype: ArchetypeId | None = None
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []

    node_ids = [node.id for node in diagram.nodes]
    seen: set[str] = set()
    duplicate_ids: set[str] = set()
    for node_id in node_ids:
        if node_id in seen:
            duplicate_ids.add(node_id)
        seen.add(node_id)
    for node_id in duplicate_ids:
        issues.append(
            ValidationIssue(
                severity=ValidationSeverity.error,
                code="duplicate_node_id",
                message=f"Node id '{node_id}' is used by more than one node.",
                node_id=node_id,
            )
        )

    valid_node_ids = set(node_ids)
    group_ids = {group.id for group in diagram.groups}

    graph = nx.DiGraph()
    graph.add_nodes_from(valid_node_ids)

    for edge in diagram.edges:
        if edge.source not in valid_node_ids:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.error,
                    code="dangling_edge_source",
                    message=f"Edge '{edge.id}' references unknown source node '{edge.source}'.",
                    edge_id=edge.id,
                )
            )
            continue
        if edge.target not in valid_node_ids:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.error,
                    code="dangling_edge_target",
                    message=f"Edge '{edge.id}' references unknown target node '{edge.target}'.",
                    edge_id=edge.id,
                )
            )
            continue
        graph.add_edge(edge.source, edge.target)

    for node in diagram.nodes:
        if node.group_id is not None and node.group_id not in group_ids:
            issues.append(
                ValidationIssue(
                    severity=ValidationSeverity.warning,
                    code="unknown_group",
                    message=f"Node '{node.id}' references unknown group '{node.group_id}'.",
                    node_id=node.id,
                )
            )

    if len(valid_node_ids) > 1:
        for node_id in valid_node_ids:
            if graph.degree(node_id) == 0:
                issues.append(
                    ValidationIssue(
                        severity=ValidationSeverity.warning,
                        code="orphan_node",
                        message=f"Node '{node_id}' has no incoming or outgoing edges.",
                        node_id=node_id,
                    )
                )

    for cycle in nx.simple_cycles(graph):
        issues.append(
            ValidationIssue(
                severity=ValidationSeverity.warning,
                code="cycle_detected",
                message=f"Cycle detected among nodes: {' -> '.join(cycle)}.",
            )
        )

    if archetype is not None:
        issues.extend(_check_archetype_conformance(diagram, graph, archetype))

    return issues
