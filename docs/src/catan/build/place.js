import { PLAYER_COLORS } from "../../config/constants.js";

export function placeSettlement(boardC, graph, vId, playerIdx, townSprites) {
  const v = graph.vertices[vId];
  const color = PLAYER_COLORS[playerIdx];
  const g = new PIXI.Graphics();
  g.beginFill(color);
  g.drawPolygon(-12, -14, 0, -24, 12, -14, 12, 8, -12, 8);
  g.endFill();
  g.lineStyle({ width: 2, color: 0x000000, alpha: 0.35 });
  g.drawPolygon(-12, -14, 0, -24, 12, -14, 12, 8, -12, 8);
  g.x = v.x; g.y = v.y;
  boardC.addChild(g);
  townSprites.set(vId, g);
}

export function placeRoad(boardC, graph, eId, playerIdx, roadSprites) {
  const e = graph.edges[eId];
  const a = graph.vertices[e.a], b = graph.vertices[e.b];
  const color = PLAYER_COLORS[playerIdx];
  const g = new PIXI.Graphics();
  g.lineStyle({ width: 12, color, alpha: 0.95, cap: 'round' });
  g.moveTo(a.x, a.y); g.lineTo(b.x, b.y);
  boardC.addChild(g);
  roadSprites.set(eId, g);
}
