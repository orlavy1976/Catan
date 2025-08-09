export function playRoadBuilding({ app, hud, state, boardC, graph, builder, startBuildRoad }) {
  let remaining = 2;

  hud.showResult("Road Building — place 2 roads for free.");
  toggleHud(hud, false);

  const placeNext = () => {
    if (remaining <= 0) { toggleHud(hud, true); hud.showResult("Road Building complete."); return; }

    startBuildRoad(
      { app, boardC, hud, state, graph, builder },
      {
        free: true,
        onPlaced: () => { remaining--; placeNext(); },
        onCancel: () => { remaining = 0; placeNext(); }
      }
    );
  };
  placeNext();
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
