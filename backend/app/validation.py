import networkx as nx

from app.models import FlowchartDiagram, ValidationIssue, ValidationSeverity


def validate_diagram(diagram: FlowchartDiagram) -> list[ValidationIssue]:
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

    return issues
