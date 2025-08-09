export function createGhostLayer(boardC) {
  const ghosts = new PIXI.Container();
  boardC.addChild(ghosts);
  return { ghosts, boardC };
}

export function clearGhosts(layers) {
  layers.ghosts.removeChildren();
}

export function drawSettlementGhost(layers, graph, vId, color, alpha=0.35) {
  const v = graph.vertices[vId];
  const g = new PIXI.Graphics();
  g.beginFill(color, alpha);
  g.drawPolygon(-12, -14, 0, -24, 12, -14, 12, 8, -12, 8);
  g.endFill();
  g.lineStyle({ width: 2, color: 0x000000, alpha: 0.2 });
  g.drawPolygon(-12, -14, 0, -24, 12, -14, 12, 8, -12, 8);
  g.x = v.x; g.y = v.y;
  layers.ghosts.addChild(g);
}

export function drawRoadGhost(layers, graph, eId, color, alpha=0.35) {
  const e = graph.edges[eId];
  const a = graph.vertices[e.a], b = graph.vertices[e.b];
  const g = new PIXI.Graphics();
  g.lineStyle({ width: 10, color, alpha, cap: 'round' });
  g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
  layers.ghosts.addChild(g);
}
