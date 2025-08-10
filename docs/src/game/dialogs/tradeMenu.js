// docs/src/game/dialogs/tradeMenu.js
// 🔄 Main Trade Menu - Entry Point for All Trading

import { createMaterialChoice } from '../../utils/materialDialog.js';
import { showBankTradeDialog } from './bankTrade.js';
import { showPlayerTradeDialog } from './playerTrade.js';

/**
 * Show main trade menu with options for bank and player trading
 * @param {object} deps - Dependencies (app, hud, state, resPanel, graph)
 */
export function showTradeMenu({ app, hud, state, resPanel, graph }) {
  const dialog = createMaterialChoice(app, {
    title: "Trade",
    message: "Choose your trading partner",
    choices: [
      { label: "🏦 Trade with Bank", value: "bank" },
      { label: "👥 Trade with Player", value: "player" }
    ],
    onChoice: (choice) => {
      dialog.close();
      if (choice === "bank") {
        showBankTradeDialog({ app, hud, state, resPanel, graph });
      } else {
        showPlayerTradeDialog({ app, hud, state, resPanel, graph });
      }
    },
    onCancel: () => {
      enableHUD(hud);
    }
  });

  disableHUD(hud);
  dialog.show();
}

/**
 * Disable HUD buttons during dialog
 * @param {object} hud - HUD instance
 */
function disableHUD(hud) {
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);
}

/**
 * Re-enable HUD buttons after dialog
 * @param {object} hud - HUD instance
 */
function enableHUD(hud) {
  hud.setEndEnabled(true);
  hud.setBuildRoadEnabled(true);
  hud.setBuildSettlementEnabled(true);
  hud.setBuildCityEnabled(true);
  hud.setTradeEnabled(true);
}
