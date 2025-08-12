import { PLAYER_COLORS } from "../../config/constants.js";
import { createEnhancedSettlement, createEnhancedRoad, createEnhancedCity } from "./enhancedGraphics.js";

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
  
  // Create enhanced city with multiple buildings and architectural details
  const city = createEnhancedCity(color, {
    scale: 1,
    showDetails: true,
    animate: true
  });
  
  city.x = v.x;
  city.y = v.y;
  
  // ודא שערים מופיעים מעל הדרכים
  city.zIndex = 15; // ערים ברמה גבוהה יותר מיישובים
  
  boardC.addChild(city);
  townSprites.set(vId, city);
}
