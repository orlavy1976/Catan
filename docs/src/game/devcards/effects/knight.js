import { patch } from "../../stateStore.js";

export function playKnight({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, enterRobberMove }) {
  const meIdx = state.currentPlayer - 1;

  // עדכון מונה אבירים + בעל Largest Army
  patch(s => {
    const me = s.players[meIdx];
    me.knightsPlayed = (me.knightsPlayed || 0) + 1;

    const ks = s.players.map(p => p?.knightsPlayed || 0);
    let bestIdx = null, bestVal = -1, tie = false;
    for (let i = 0; i < ks.length; i++) {
      const v = ks[i];
      if (v > bestVal) { bestVal = v; bestIdx = i; tie = false; }
      else if (v === bestVal) { tie = true; }
    }
    s.largestArmyOwner = (bestVal >= 3 && !tie) ? bestIdx : null;
  });

  state.phase = "move-robber";
  hud.showResult("Knight played — move the robber and steal 1 resource.");
  hud.setBottom("Click a tile to move the robber");
  toggleHud(hud, false);

  enterRobberMove({ app, boardC, hud, state, tileSprites, robberSpriteRef, graph, layout, resPanel }, () => {
    state.phase = "play";
    hud.setBottom("You may build, trade, or end the turn");
    toggleHud(hud, true);
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
