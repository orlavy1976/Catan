// Victory handling: check and show winner overlay
import { WIN_POINTS } from "./score.js";
import { createMaterialAlert } from "../utils/materialDialog.js";
import { PLAYER_COLORS } from "../config/constants.js";

let _victoryShown = false;

export function maybeHandleVictory({ app, hud, state }, scores) {
  if (_victoryShown || state.phase === "ended") return;

  const meIdx = state.currentPlayer - 1;
  const my = scores?.[meIdx]?.total ?? 0;

  // כלל בסיסי בקטאן: מי שמגיע ראשון ל-10 בתורו — מנצח מיידית
  if (my >= WIN_POINTS) {
    state.phase = "ended";
    _victoryShown = true;
    lockHud(hud);
    showVictoryOverlay(app, meIdx + 1, my, meIdx);
  }
}

function lockHud(hud) {
  try {
    hud.setRollEnabled(false);
    hud.setEndEnabled(false);
    hud.setBuildRoadEnabled(false);
    hud.setBuildSettlementEnabled(false);
    hud.setBuildCityEnabled(false);
    hud.setTradeEnabled(false);
    hud.setBuyDevEnabled(false);
    hud.setPlayDevEnabled(false);
  } catch {}
}

function showVictoryOverlay(app, playerNumber, points, playerIdx) {
  // Get player color names for better message
  const colorNames = ['Red', 'Blue', 'Orange', 'Green'];
  const colorName = colorNames[playerIdx] || 'Unknown';
  
  // Create Material Design alert for victory
  const alert = createMaterialAlert(app, {
    title: "🎉 Victory!",
    message: `Player ${playerNumber} (${colorName}) wins with ${points} victory points!\n\nCongratulations! The game is now complete.\n\nUse the reset button to start a new game.`,
    buttonText: "Game Complete",
    animation: 'scale',
    elevation: 3,
    persistent: true // Don't allow closing by clicking outside
  });
  
  alert.show();
}


