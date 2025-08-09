export function legalSettlementVertices(graph, occupiedVertices) {
  const { vertices, vAdjVertices } = graph;
  const illegal = new Set(occupiedVertices);
  occupiedVertices.forEach(vId => {
    vAdjVertices[vId].forEach(nId => illegal.add(nId));
  });
  const legals = [];
  for (let i = 0; i < vertices.length; i++) {
    if (!illegal.has(i)) legals.push(i);
  }
  return legals;
}

export function legalRoadEdges(graph, occupiedEdges, occupiedVertices, lastSettlementVertex) {
  const { edges } = graph;
  const legals = [];
  const vId = lastSettlementVertex;
  // edges שנוגעים ב-vId בלבד (בשלב setup)
  for (let eId = 0; eId < edges.length; eId++) {
    const e = edges[eId];
    if ((e.a === vId || e.b === vId) && !occupiedEdges.has(eId)) {
      legals.push(eId);
    }
  }
  return legals;
}
