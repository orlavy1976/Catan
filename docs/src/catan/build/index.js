import { createGhostLayer, drawSettlementGhost, drawRoadGhost, clearGhosts } from "./ghosts.js";
import { placeSettlement, placeRoad } from "./place.js";
import { legalSettlementVertices, legalRoadEdges } from "./legality.js";

// מאחד את שלושת הקבצים לאותו API שהיה קודם
export function makeBuilder(app, boardC, graph, state) {
  const layers = createGhostLayer(boardC);

  // מפות גרפיקה (נשמר כמו קודם)
  const roadSprites = new Map();
  const townSprites = new Map();

  return {
    // ghosts
    clearGhosts: () => clearGhosts(layers),
    drawSettlementGhost: (vId, color, alpha=0.35) =>
      drawSettlementGhost(layers, graph, vId, color, alpha),
    drawRoadGhost: (eId, color, alpha=0.35) =>
      drawRoadGhost(layers, graph, eId, color, alpha),

    // place
    placeSettlement: (vId, playerIdx) =>
      placeSettlement(boardC, graph, vId, playerIdx, townSprites),
    placeRoad: (eId, playerIdx) =>
      placeRoad(boardC, graph, eId, playerIdx, roadSprites),

    // legality
    legalSettlementVertices: (occupiedVertices) =>
      legalSettlementVertices(graph, occupiedVertices),
    legalRoadEdges: (occupiedEdges, occupiedVertices, lastSettlementVertex) =>
      legalRoadEdges(graph, occupiedEdges, occupiedVertices, lastSettlementVertex),

    // expose maps (כמו שהיה)
    roadSprites, townSprites,
  };
}
