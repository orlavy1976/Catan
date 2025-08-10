import { placeSettlement, placeRoad, placeCity } from "./place.js";
import { legalSettlementVertices, legalRoadEdges } from "./legality.js";

/**
 * Builder מאוחד: מצייר Ghosts, מציב חלקים, ובודק חוקיות.
 * אין תלות ב-ghosts.js (הכול מקומי כאן).
 */
export function makeBuilder(app, boardC, graph, state) {
  // שכבת היילייט/גוסט
  const ghostsLayer = new PIXI.Container();
  boardC.addChild(ghostsLayer);

  // מפות ספרייטים קבועות (כבישים/יישובים/ערים)
  const roadSprites = new Map();
  const townSprites = new Map();

  // --- Ghost API (מקומי) ---
  function clearGhosts() {
    ghostsLayer.removeChildren();
  }

  function drawSettlementGhost(vId, color, alpha = 0.35) {
    const v = graph.vertices[vId];
    const g = new PIXI.Graphics();
    g.beginFill(color, alpha);
    g.drawPolygon(-12, -14, 0, -24, 12, -14, 12, 8, -12, 8);
    g.endFill();
    g.lineStyle({ width: 2, color: 0x000000, alpha: 0.2 });
    g.drawPolygon(-12, -14, 0, -24, 12, -14, 12, 8, -12, 8);
    g.x = v.x; g.y = v.y;
    ghostsLayer.addChild(g);
  }

  function drawRoadGhost(eId, color, alpha = 0.35) {
    const e = graph.edges[eId];
    const a = graph.vertices[e.a], b = graph.vertices[e.b];
    const g = new PIXI.Graphics();
    g.lineStyle({ width: 10, color, alpha, cap: "round" });
    g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
    ghostsLayer.addChild(g);
  }

  function drawCityGhost(vId, color, alpha = 0.7) {
    const v = graph.vertices[vId];
    
    // Create a container for the city ghost with indicator
    const container = new PIXI.Container();
    container.x = v.x;
    container.y = v.y;
    
    // Large bright circle indicator for excellent visibility
    const indicator = new PIXI.Graphics();
    indicator.beginFill(0xFFFF00, 0.3); // Bright yellow background
    indicator.drawCircle(0, 0, 30);
    indicator.endFill();
    indicator.lineStyle({ width: 4, color: 0xFFFF00, alpha: 0.9 }); // Bright yellow border
    indicator.drawCircle(0, 0, 30);
    container.addChild(indicator);
    
    // City ghost shape - more prominent
    const cityGhost = new PIXI.Graphics();
    cityGhost.beginFill(color, alpha);
    cityGhost.drawPolygon(-14, -10, -4, -26, 6, -10, 6, 6, -14, 6);
    cityGhost.endFill();
    
    // Add a bright white outline for contrast
    cityGhost.lineStyle({ width: 3, color: 0xFFFFFF, alpha: 1.0 });
    cityGhost.drawPolygon(-14, -10, -4, -26, 6, -10, 6, 6, -14, 6);
    
    container.addChild(cityGhost);
    
    ghostsLayer.addChild(container);
  }

  // --- API חיצוני תואם לקודם ---
  return {
    // Ghosts
    clearGhosts,
    drawSettlementGhost,
    drawRoadGhost,
    drawCityGhost,

    // הצבות בפועל
    placeSettlement: (vId, playerIdx) =>
      placeSettlement(boardC, graph, vId, playerIdx, townSprites),
    placeRoad: (eId, playerIdx) =>
      placeRoad(boardC, graph, eId, playerIdx, roadSprites),
    placeCity: (vId, playerIdx) =>
      placeCity(boardC, graph, vId, playerIdx, townSprites),

    // חוקיות (Setup: קיימות כמו שהיו)
    legalSettlementVertices: (occupiedVertices) =>
      legalSettlementVertices(graph, occupiedVertices),
    legalRoadEdges: (occupiedEdges, occupiedVertices, lastSettlementVertex) =>
      legalRoadEdges(graph, occupiedEdges, occupiedVertices, lastSettlementVertex),

    // חשיפה למפות (אם יש שימוש חיצוני)
    roadSprites,
    townSprites,
  };
}
