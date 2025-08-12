import { createEnhancedSettlement, createEnhancedRoad } from "./enhancedGraphics.js";

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
  const g = new PIXI.Graphics();
  g.beginFill(color, alpha);
  g.drawPolygon(-14,-10, -4,-26, 6,-10, 6,6, -14,6);
  g.endFill();
  g.lineStyle({ width: 2, color: 0x000000, alpha: 0.2 });
  g.drawPolygon(-14,-10, -4,-26, 6,-10, 6,6, -14,6);
  g.x = v.x; g.y = v.y;
  layers.ghosts.addChild(g);
}
