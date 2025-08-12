import { patch } from "../../stateStore.js";

export function playRoadBuilding({ app, hud, state, boardC, graph, builder, startBuildRoad, refreshHudAvailability }) {
  let remaining = 2;

  // Remove the Road Building card from inventory immediately
  patch(s => {
    const me = s.players[s.currentPlayer - 1];
    me.dev.road_building = Math.max(0, (me.dev.road_building || 0) - 1);
  });

  hud.showResult("Road Building — place 2 roads for free.");
  toggleHud(hud, false);

  const placeNext = () => {
    if (remaining <= 0) { 
      // Use proper resource validation instead of enabling everything
      refreshHudAvailability();
      hud.showResult("Road Building complete."); 
      return; 
    }

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
