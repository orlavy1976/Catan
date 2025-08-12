import { BUILD_COSTS, PLAYER_COLORS } from "../config/constants.js";
import { patch } from "./stateStore.js";

/**
 * מצב "Build City": שדרוג יישוב שלך לעיר.
 * context: { app, boardC, hud, state, graph, builder }
 */
export function startBuildCity(context) {
  const { boardC, hud, state, graph, builder } = context;
  const player = currentPlayer(state);

  if (!hasResources(player.resources, BUILD_COSTS.city)) {
    hud.showResult("Not enough resources (need 2 wheat + 3 ore)");
    return builder.clearGhosts();
  }

  const candidates = [...player.settlements];
  if (candidates.length === 0) {
    hud.showResult("You have no settlements to upgrade.");
    return builder.clearGhosts();
  }

  builder.clearGhosts();
  const color = PLAYER_COLORS[player.colorIdx];
  
  // Show user feedback about what to do
  hud.showResult(`Click on any of your ${candidates.length} settlements to upgrade to a city`);
  
  // Draw bright city ghosts at settlement locations
  candidates.forEach(vId => builder.drawCityGhost(vId, color, 0.7));

  const interactive = new PIXI.Container();
  boardC.addChild(interactive);

  candidates.forEach(vId => {
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
        pay(p.resources, BUILD_COSTS.city);
        const idx = p.settlements.indexOf(vId);
        if (idx >= 0) p.settlements.splice(idx, 1);
        // Ensure cities array exists
        p.cities = p.cities || [];
        p.cities.push(vId);
      });

      builder.placeCity(vId, player.colorIdx);
      hud.showResult("Upgraded to a city");
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
function hasResources(res, cost){ return Object.keys(cost).every(k => (res[k]||0) >= cost[k]); }
function pay(res, cost){ for (const k in cost) res[k] -= cost[k]; }
