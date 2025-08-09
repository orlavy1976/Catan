export const PLAYER_COLORS = [
  0xd32f2f, // אדום
  0x1976d2, // כחול
  0xffa000, // כתום
  0x388e3c, // ירוק
];

export function makeBuilder(app, boardC, graph, state) {
  const { vertices, edges, vAdjVertices } = graph;

  // שכבות ציור
  const roadsLayer = new PIXI.Container();
  const townsLayer = new PIXI.Container();
  boardC.addChild(roadsLayer, townsLayer);

  // מודלים גרפיים שנחזיר כדי שנוכל לשמור ב-state
  const roadSprites = new Map();     // edgeId -> Graphics
  const townSprites = new Map();     // vertexId -> Graphics

  // עזר: ציור Ghost highlight
  const ghosts = new PIXI.Container();
  boardC.addChild(ghosts);
  function clearGhosts(){ ghosts.removeChildren(); }

  function drawSettlementGhost(vId, color, alpha=0.35) {
    const v = vertices[vId];
    const g = new PIXI.Graphics();
    g.beginFill(color, alpha);
    g.drawPolygon(-10, -12, 10, -12, 10, 10, -10, 10);
    g.endFill();
    g.lineStyle({ width: 2, color: 0x000000, alpha: 0.2 });
    g.drawPolygon(-10, -12, 10, -12, 10, 10, -10, 10);
    g.x = v.x; g.y = v.y - 10;
    ghosts.addChild(g);
  }

  function drawRoadGhost(eId, color, alpha=0.35) {
    const e = edges[eId];
    const a = vertices[e.a], b = vertices[e.b];
    const g = new PIXI.Graphics();
    g.lineStyle({ width: 10, color, alpha });
    g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
    ghosts.addChild(g);
  }

  // ציור בפועל
  function placeSettlement(vId, playerIdx) {
    const v = vertices[vId];
    const color = PLAYER_COLORS[playerIdx];
    const g = new PIXI.Graphics();
    g.beginFill(color);
    g.drawPolygon(-12, -16, 12, -16, 12, 10, -12, 10);
    g.endFill();
    g.lineStyle({ width: 2, color: 0x000000, alpha: 0.35 });
    g.drawPolygon(-12, -16, 12, -16, 12, 10, -12, 10);
    g.x = v.x; g.y = v.y - 12;
    townsLayer.addChild(g);
    townSprites.set(vId, g);
  }

  function placeRoad(eId, playerIdx) {
    const e = edges[eId];
    const a = vertices[e.a], b = vertices[e.b];
    const color = PLAYER_COLORS[playerIdx];
    const g = new PIXI.Graphics();
    g.lineStyle({ width: 12, color, alpha: 0.95, cap: 'round' });
    g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
    roadsLayer.addChild(g);
    roadSprites.set(eId, g);
  }

  // חוקיות: התיישבות בשלב setup — מרחק שתי פינות
  function legalSettlementVertices(occupiedVertices) {
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

  // חוקיות: כביש צמוד להתיישבות אחרונה שהוצבה (ב־setup)
  function legalRoadEdges(occupiedEdges, occupiedVertices, lastSettlementVertex) {
    const legals = [];
    const vId = lastSettlementVertex;
    const touching = [];
    // edges שנוגעים ב-vId
    for (let eId = 0; eId < edges.length; eId++) {
      const e = edges[eId];
      if (e.a === vId || e.b === vId) touching.push(eId);
    }
    touching.forEach(eId => { if (!occupiedEdges.has(eId)) legals.push(eId); });
    return legals;
  }

  return {
    clearGhosts,
    drawSettlementGhost,
    drawRoadGhost,
    placeSettlement,
    placeRoad,
    legalSettlementVertices,
    legalRoadEdges,
    roadSprites,
    townSprites,
  };
}
