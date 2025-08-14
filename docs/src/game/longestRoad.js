/**
 * Compute Longest Road for all players.
 * Rules simplified: A road chain cannot pass through a vertex with an opponent's settlement/city.
 * Returns { owner: idx|null, length }.
 */
export function computeLongestRoad(state, graph) {
  const blockedByOpponent = buildBlockedVertices(state);
  const perPlayer = state.players.map((p, idx) => longestForPlayer(idx, state, graph, blockedByOpponent));
  let bestLen = 0, bestOwner = null;

  perPlayer.forEach((len, idx) => {
    if (len > bestLen) { bestLen = len; bestOwner = idx; }
  });

  // Standard rule: must be >=5 to claim
  if (bestLen < 5) return { owner: null, length: bestLen };

  return { owner: bestOwner, length: bestLen };
}

export function updateLongestRoad(state, graph) {
  const prevOwner = state.longestRoad?.owner ?? null;
  const prevLen = state.longestRoad?.length ?? 0;
  const res = computeLongestRoad(state, graph);
  state.longestRoad = { owner: res.owner, length: res.length };

  const changed = (prevOwner !== res.owner) || (prevLen !== res.length);
  return { ...res, changed, prevOwner, prevLen };
}

function buildBlockedVertices(state) {
  // vertex is blocked if it has a settlement/city owned by *someone other than* the path owner.
  // We build a map: vertexId -> ownerIdx (or null if none)
  const ownByVertex = new Map();
  state.players.forEach((p, idx) => {
    p.settlements.forEach(v => ownByVertex.set(v, idx));
    (p.cities || []).forEach(v => ownByVertex.set(v, idx));
  });
  return ownByVertex; // lookups used later
}

function longestForPlayer(playerIdx, state, graph, ownByVertex) {
  const myEdges = new Set(state.players[playerIdx].roads || []);
  if (myEdges.size === 0) return 0;

  // Build adjacency of edges via vertices, excluding passes through opponent-owned vertices
  const neighbors = new Map(); // eId -> Set<eId>
  for (const eId of myEdges) neighbors.set(eId, new Set());
  for (const eId of myEdges) {
    const e = graph.edges[eId];
    const ends = [e.a, e.b];
    for (const v of ends) {
      const ownerAtV = ownByVertex.get(v);
      // If vertex is occupied by opponent, you can *end* at it but not pass *through* it.
      // We enforce this by only linking edges that share v if v is NOT owned by opponent.
      const canPass = (ownerAtV == null) || (ownerAtV === playerIdx);
      if (!canPass) continue;

      // connect to my other edges touching v
      for (let nId = 0; nId < graph.edges.length; nId++) {
        if (nId === eId) continue;
        if (!myEdges.has(nId)) continue;
        const ne = graph.edges[nId];
        if (ne.a === v || ne.b === v) {
          neighbors.get(eId).add(nId);
        }
      }
    }
  }

  // DFS longest simple path in edge graph (no repeated edge or vertex)
  let best = 1;
  const visitedEdges = new Set();
  function dfs(edgeId, usedVertices) {
    visitedEdges.add(edgeId);
    const e = graph.edges[edgeId];
    let localBest = 1;
    for (const n of neighbors.get(edgeId)) {
      if (visitedEdges.has(n)) continue;
      const ne = graph.edges[n];
      // נוודא שלא חוזרים על קודקוד באמצע הדרך
      // edgeId: (e.a, e.b), n: (ne.a, ne.b)
      // מצא את הקודקוד המשותף
      const shared = (e.a === ne.a || e.a === ne.b) ? e.a : e.b;
      if (usedVertices.has(shared)) continue;
      usedVertices.add(shared);
      localBest = Math.max(localBest, 1 + dfs(n, usedVertices));
      usedVertices.delete(shared);
    }
    visitedEdges.delete(edgeId);
    return localBest;
  }

  for (const eId of myEdges) {
    // נתחיל עם שני קודקודים – קצוות הכביש הראשון
    const e = graph.edges[eId];
    // ננסה להתחיל מכל קצה
    [e.a, e.b].forEach(startV => {
      const usedVertices = new Set([startV]);
      best = Math.max(best, dfs(eId, usedVertices));
    });
  }

  return best;
}
