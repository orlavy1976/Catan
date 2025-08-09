import { BUILD_COSTS, PLAYER_COLORS } from "../config/constants.js";
import { patch } from "./stateStore.js";

/**
 * מצב "בניית יישוב": מציג צמתים חוקיים (מרחק-2 + חיבור לרשת שלך), גובה עלות, ומציב.
 * context: { app, boardC, hud, state, graph, builder }
 */
export function startBuildSettlement(context) {
  const { boardC, hud, state, graph, builder } = context;

  const player = currentPlayer(state);
  if (!hasResources(player.resources, BUILD_COSTS.settlement)) {
    hud.showResult("Not enough resources (brick, wood, wheat, sheep)");
    return builder.clearGhosts();
  }

  // תפוסות מכל השחקנים
  const occupiedVertices = new Set();
  state.players.forEach(p => p.settlements.forEach(vId => occupiedVertices.add(vId)));
  state.players.forEach(p => p.cities?.forEach(vId => occupiedVertices.add(vId)));

  // כבישים של השחקן
  const playerEdges = new Set(player.roads);

  // צמתים חוקיים
  const legalVertices = legalSettlementVerticesPlay(graph, occupiedVertices, playerEdges);
  if (legalVertices.length === 0) {
    hud.showResult("No legal settlement spots");
    return builder.clearGhosts();
  }

  builder.clearGhosts();
  const color = PLAYER_COLORS[player.colorIdx];
  legalVertices.forEach(vId => builder.drawSettlementGhost(vId, color, 0.35));

  const interactive = new PIXI.Container();
  boardC.addChild(interactive);

  legalVertices.forEach(vId => {
    const v = graph.vertices[vId];
    const hit = new PIXI.Graphics();
    hit.beginFill(0x000000, 0.001);
    hit.drawCircle(v.x, v.y, 18);
    hit.endFill();
    hit.eventMode = "static";
    hit.cursor = "pointer";
    hit.on("pointertap", () => {
      patch(s => {
        const p = s.players[s.currentPlayer - 1];
        pay(p.resources, BUILD_COSTS.settlement);
        p.settlements.push(vId);
      });

      builder.placeSettlement(vId, player.colorIdx);
      hud.showResult("Built a settlement");
      finish();
    });
    interactive.addChild(hit);
  });

  hud.setEndEnabled(false);

  function finish() {
    builder.clearGhosts();
    boardC.removeChild(interactive);
    hud.setEndEnabled(true);
  }
}

function currentPlayer(state){ return state.players[state.currentPlayer - 1]; }

function hasResources(res, cost){
  return Object.keys(cost).every(k => (res[k] || 0) >= cost[k]);
}
function pay(res, cost){
  for (const k in cost) res[k] -= cost[k];
}

/**
 * חוקיות יישוב בתור רגיל:
 * - הצומת עצמו לא תפוס
 * - אף שכן שלו לא תפוס (מרחק-2)
 * - יש לפחות כביש אחד שלך היוצא מהצומת
 */
function legalSettlementVerticesPlay(graph, occupiedVertices, playerEdges) {
  const { vAdjVertices, vAdjEdges } = graph;
  const legals = [];
  for (let vId = 0; vId < graph.vertices.length; vId++) {
    if (occupiedVertices.has(vId)) continue;

    // מרחק-2
    let nearBusy = false;
    for (const n of vAdjVertices[vId]) {
      if (occupiedVertices.has(n)) { nearBusy = true; break; }
    }
    if (nearBusy) continue;

    // כביש שלי נוגע בצומת
    let touchesMyRoad = false;
    for (const eId of vAdjEdges[vId]) {
      if (playerEdges.has(eId)) { touchesMyRoad = true; break; }
    }
    if (!touchesMyRoad) continue;

    legals.push(vId);
  }
  return legals;
}
