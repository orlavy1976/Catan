import { PLAYER_COLORS } from "../../config/constants.js";
import { createEnhancedSettlement, createEnhancedRoad } from "./enhancedGraphics.js";

export function placeRoad(boardC, graph, eId, playerIdx, roadSprites) {
  const e = graph.edges[eId];
  const a = graph.vertices[e.a];
  const b = graph.vertices[e.b];
  const color = PLAYER_COLORS[playerIdx];
  
  // Create enhanced road with stone texture and perspective
  const road = createEnhancedRoad(a, b, color, {
    scale: 1,
    showDetails: true,
    animate: true
  });
  
  // ודא שהדרכים מופיעות מתחת ליישובים
  road.zIndex = 1; // דרכים ברמה נמוכה
  
  boardC.addChild(road);
  roadSprites.set(eId, road);
}

export function placeSettlement(boardC, graph, vId, playerIdx, townSprites) {
  const v = graph.vertices[vId];
  const color = PLAYER_COLORS[playerIdx];
  
  // Create enhanced settlement with architectural details
  const settlement = createEnhancedSettlement(color, {
    scale: 1,
    showDetails: true,
    animate: true
  });
  
  settlement.x = v.x;
  settlement.y = v.y;
  
  // ודא שיישובים מופיעים מעל הדרכים
  settlement.zIndex = 10; // יישובים ברמה גבוהה
  
  boardC.addChild(settlement);
  townSprites.set(vId, settlement);
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
