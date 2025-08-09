import { BUILD_COSTS, PLAYER_COLORS } from "../config/constants.js";
import { patch } from "./stateStore.js";

/**
 * מצב "בניית כביש": מציג קצוות חוקיים, גובה עלות (אלא אם free), ומציב.
 * context: { app, boardC, hud, state, graph, builder }
 * opts: { free?:boolean, onPlaced?:()=>void, onCancel?:()=>void }
 */
export function startBuildRoad(context, opts = {}) {
  const { boardC, hud, state, graph, builder } = context;
  const { free = false, onPlaced, onCancel } = opts;

  const player = currentPlayer(state);

  // בדיקת עלות (אם לא free)
  if (!free) {
    const canPay = hasResources(player.resources, BUILD_COSTS.road);
    if (!canPay) {
      hud.showResult("Not enough resources (need 1 brick + 1 wood)");
      return cleanup();
    }
  }

  // אוסף תפוסים מכל השחקנים
  const occupiedEdges = new Set();
  state.players.forEach(p => p.roads.forEach(eId => occupiedEdges.add(eId)));

  // קצוות חוקיים מחוברים לרשת שלך
  const legalEdges = legalRoadEdgesPlay(graph, state, state.currentPlayer - 1, occupiedEdges);
  if (legalEdges.length === 0) {
    hud.showResult("No legal road placements");
    return cleanup();
  }

  builder.clearGhosts();
  const color = PLAYER_COLORS[player.colorIdx];
  legalEdges.forEach(eId => builder.drawRoadGhost(eId, color, 0.35));

  // היטים עבים לבחירה
  const interactive = new PIXI.Container();
  boardC.addChild(interactive);

  legalEdges.forEach(eId => {
    const e = graph.edges[eId];
    const a = graph.vertices[e.a], b = graph.vertices[e.b];
    const hit = makeThickEdgeHit(a, b, 10);
    hit.eventMode = "static";
    hit.cursor = "pointer";
    hit.on("pointertap", () => {
      // גבה עלות + עדכן state
      patch(s => {
        const p = s.players[s.currentPlayer - 1];
        if (!free) pay(p.resources, BUILD_COSTS.road);
        p.roads.push(eId);
      });

      // ציור בפועל
      builder.placeRoad(eId, player.colorIdx);

      hud.showResult(free ? "Built a road (free)" : "Built a road");

      finish();
      onPlaced?.();
    });
    interactive.addChild(hit);
  });

  // בזמן Build ננטרל End כדי למנוע מצב ביניים
  hud.setEndEnabled(false);

  function finish() {
    builder.clearGhosts();
    boardC.removeChild(interactive);
    hud.setEndEnabled(true);
  }
  function cleanup() {
    builder.clearGhosts();
    onCancel?.();
  }
}

function currentPlayer(state){ return state.players[state.currentPlayer - 1]; }

function hasResources(res, cost){
  return Object.keys(cost).every(k => (res[k] || 0) >= cost[k]);
}
function pay(res, cost){
  for (const k in cost) res[k] -= cost[k];
}

// חוקיות כביש בתור רגיל: חייב לגעת ברשת שלך (יישוב/עיר או קצה כביש שלך)
function legalRoadEdgesPlay(graph, state, playerIdx, occupiedEdges){
  const networkVertices = new Set();
  const player = state.players[playerIdx];

  player.settlements.forEach(vId => networkVertices.add(vId));
  player.roads.forEach(eId => {
    const e = graph.edges[eId];
    networkVertices.add(e.a); networkVertices.add(e.b);
  });

  const legals = [];
  for (let eId = 0; eId < graph.edges.length; eId++) {
    if (occupiedEdges.has(eId)) continue;
    const e = graph.edges[eId];
    if (networkVertices.has(e.a) || networkVertices.has(e.b)) legals.push(eId);
  }
  return legals;
}

function makeThickEdgeHit(a, b, half=10){
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const p1 = [a.x + nx*half, a.y + ny*half];
  const p2 = [b.x + nx*half, b.y + ny*half];
  const p3 = [b.x - nx*half, b.y - ny*half];
  const p4 = [a.x - nx*half, a.y - ny*half];
  const poly = new PIXI.Polygon([...p1, ...p2, ...p3, ...p4]);
  const g = new PIXI.Graphics();
  g.hitArea = poly;
  g.beginFill(0x000000, 0.001);
  g.drawPolygon(poly.points);
  g.endFill();
  return g;
}
