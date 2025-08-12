import { patch } from "../../stateStore.js";
import { enterRobberMove } from "../../robber.js";

export function playKnight({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, refreshHudAvailability }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  
  // Play the knight and remove it from inventory
  patch(s => {
    const me = s.players[s.currentPlayer - 1];
    me.knightsPlayed++;
    // Remove the knight card from inventory
    me.dev.knight = Math.max(0, (me.dev.knight || 0) - 1);
  });

  // Update state to robber move phase
  patch(s => { s.phase = "move-robber"; });

  hud.setBottom("Knight activated — move the robber");
  toggleHud(hud, false);

  enterRobberMove({ app, boardC, hud, state, tileSprites, robberSpriteRef, graph, layout, resPanel }, () => {
    patch(s => { s.phase = "play"; });
    hud.setBottom("You may build, trade, or end the turn");
    // Use proper resource validation instead of enabling everything
    refreshHudAvailability();
    hud.showResult("Robber moved.");
    resPanel?.updateResources?.(state.players, state);
  });
}

function toggleHud(hud, on) {
  hud.setRollEnabled(false);
  hud.setEndEnabled(on);
  hud.setBuildRoadEnabled(on);
  hud.setBuildSettlementEnabled(on);
  hud.setBuildCityEnabled(on);
  hud.setTradeEnabled(on);
  hud.setBuyDevEnabled(on);
  hud.setPlayDevEnabled(on);
}
