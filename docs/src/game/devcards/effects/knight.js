import { patch } from "../../stateStore.js";
import { enterRobberMove } from "../../robber.js";

export function playKnight({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, refreshHudAvailability }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  
  // Play the knight
  patch(s => {
    s.players[s.currentPlayer - 1].knightsPlayed++;
  });

  // Update state to robber move phase
  patch(s => { s.phase = "move-robber"; });

  hud.setBottom("Knight activated — move the robber");
  toggleHud(hud, false);

  enterRobberMove({ app, boardC, hud, state, tileSprites, robberSpriteRef, graph, layout, resPanel }, () => {
    state.phase = "play";
    hud.setBottom("You may build, trade, or end the turn");
    // Use proper resource validation instead of enabling everything
    refreshHudAvailability();
    hud.showResult("Robber moved.");
    resPanel?.updateResources?.(state.players);
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
