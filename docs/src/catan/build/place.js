import { PLAYER_COLORS } from "../../config/constants.js";

export function placeSettlement(boardC, graph, vId, playerIdx, townSprites) {
  const v = graph.vertices[vId];
  const color = PLAYER_COLORS[playerIdx];
  const g = new PIXI.Graphics();
  g.beginFill(color);
  g.drawPolygon(-12,-14, 0,-24, 12,-14, 12,8, -12,8);
  g.endFill();
  g.lineStyle({ width: 2, color: 0x000000, alpha: 0.35 });
  g.drawPolygon(-12,-14, 0,-24, 12,-14, 12,8, -12,8);
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

// 🆕 עיר: מחליפה את הספרייט של היישוב
export function placeCity(boardC, graph, vId, playerIdx, townSprites) {
  const v = graph.vertices[vId];
  // אם יש ספרייט ישוב — הסר אותו
  const existing = townSprites.get(vId);
  if (existing) {
    existing.parent?.removeChild(existing);
    existing.destroy();
  }
  const color = PLAYER_COLORS[playerIdx];
  const g = new PIXI.Graphics();
  g.beginFill(color);
  // צורת עיר – קצת גבוהה/רחבה יותר, “בית עם מגדל”
  g.drawPolygon(
    -14,-10,  -4,-26,   6,-10,   6,6,   -14,6   // גוף
  );
  g.endFill();
  g.lineStyle({ width: 2, color: 0x000000, alpha: 0.35 });
  g.moveTo(-4,-26); g.lineTo(-4,-32); g.lineTo(2,-28); // “מגדלון” קטן
  g.x = v.x; g.y = v.y;
  boardC.addChild(g);
  townSprites.set(vId, g);
}
