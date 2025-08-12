import { createEnhancedSettlement, createEnhancedRoad, createEnhancedCity } from "./enhancedGraphics.js";

export function drawSettlementGhost(layers, graph, vId, color, alpha=0.35) {
  const v = graph.vertices[vId];
  
  // Create enhanced settlement ghost with reduced details and transparency
  const ghost = createEnhancedSettlement(color, {
    scale: 1,
    showDetails: false, // Simplified for ghost preview
    animate: false      // No animation for ghost
  });
  
  // Apply ghost transparency
  ghost.alpha = alpha;
  ghost.x = v.x;
  ghost.y = v.y;
  
  layers.ghosts.addChild(ghost);
}

export function drawRoadGhost(layers, graph, eId, color, alpha=0.35) {
  const e = graph.edges[eId];
  const a = graph.vertices[e.a];
  const b = graph.vertices[e.b];
  
  // Simple enhanced road ghost - just improved visual style, no complex effects
  const ghost = createEnhancedRoad(a, b, color, {
    scale: 1,
    showDetails: false, // No texture details for ghost
    animate: false      // No animation for ghost
  });
  
  // Apply ghost transparency
  ghost.alpha = alpha;
  
  layers.ghosts.addChild(ghost);
}

// 🆕
export function drawCityGhost(layers, graph, vId, color, alpha=0.35) {
  const v = graph.vertices[vId];
  
  // Create enhanced city ghost with reduced details and transparency
  const ghost = createEnhancedCity(color, {
    scale: 1,
    showDetails: false, // Simplified for ghost preview
    animate: false      // No animation for ghost
  });
  
  // Apply ghost transparency
  ghost.alpha = alpha;
  ghost.x = v.x;
  ghost.y = v.y;
  
  layers.ghosts.addChild(ghost);
}
