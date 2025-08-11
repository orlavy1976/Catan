// docs/src/game/dialogs/devcards.js
// 🃏 Development Card Dialog System
// Modern, design-system-based development card dialogs

import { 
  createResourceDialog,
  DIALOG_ANIMATION 
} from "../../utils/dialog.js";
import { patch } from "../stateStore.js";

/**
 * Show year of plenty resource selection
 * @param {object} deps - Dependencies
 */
export function showYearOfPlentyDialog(deps) {
  console.log("🎴 showYearOfPlentyDialog: Function called with deps:", deps);
  
  const { app, hud, state, resPanel, refreshScores } = deps;
  
  let selectedResources = [];
  
  function selectFirstResource() {
    console.log("🎴 showYearOfPlentyDialog: selectFirstResource called");
    
    const dialog = createResourceDialog(app, {
      title: "Year of Plenty (1/2)",
      subtitle: "Choose your first resource from the bank",
      resources: ['brick', 'wood', 'wheat', 'sheep', 'ore'],
      animation: DIALOG_ANIMATION.SCALE,
      onResourceSelect: (resource) => {
        console.log("🎴 showYearOfPlentyDialog: First resource selected:", resource);
        selectedResources = [resource];
        selectSecondResource();
      },
      onCancel: () => {
        console.log("🎴 showYearOfPlentyDialog: First dialog cancelled");
        enableHUD(hud);
      }
    });

    dialog.show();
  }
  
  function selectSecondResource() {
    console.log("🎴 showYearOfPlentyDialog: selectSecondResource called");
    
    const dialog = createResourceDialog(app, {
      title: "Year of Plenty (2/2)",
      subtitle: `First: ${selectedResources[0]}. Choose your second resource`,
      resources: ['brick', 'wood', 'wheat', 'sheep', 'ore'],
      animation: DIALOG_ANIMATION.SCALE,
      onResourceSelect: (resource) => {
        console.log("🎴 showYearOfPlentyDialog: Second resource selected:", resource);
        selectedResources.push(resource);
        executeYearOfPlenty(selectedResources, state, resPanel, hud, refreshScores);
        enableHUD(hud);
      },
      onCancel: () => {
        console.log("🎴 showYearOfPlentyDialog: Second dialog cancelled, going back");
        selectFirstResource();
      }
    });

    dialog.show();
  }

  disableHUD(hud);
  selectFirstResource();
}

/**
 * Execute year of plenty effect
 * @param {Array} resources - Selected resources
 * @param {object} state - Game state
 * @param {object} resPanel - Resource panel
 * @param {object} hud - HUD
 * @param {function} refreshScores - Score refresh function
 */
function executeYearOfPlenty(resources, state, resPanel, hud, refreshScores) {
  // Use patch to ensure reactive updates
  patch(s => {
    const me = s.players[s.currentPlayer - 1];
    
    resources.forEach(resource => {
      me.resources[resource] = (me.resources[resource] || 0) + 1;
    });
  });

  resPanel?.updateResources?.(state.players);
  hud.showResult(`Year of Plenty: received ${resources.join(' and ')}`);
  refreshScores?.();
  enableHUD(hud);
}

/**
 * Execute monopoly effect
 * @param {string} resource - Resource to monopolize
 * @param {object} state - Game state
 * @param {object} resPanel - Resource panel
 * @param {object} hud - HUD
 * @param {function} refreshScores - Score refresh function
 */
function executeMonopoly(resource, state, resPanel, hud, refreshScores) {
  const meIdx = state.currentPlayer - 1;
  let taken = 0;

  // Use patch to ensure reactive updates
  patch(s => {
    const me = s.players[meIdx];
    
    s.players.forEach((player, index) => {
      if (index === meIdx) return;
      
      const amount = player.resources[resource] || 0;
      if (amount > 0) {
        player.resources[resource] = 0;
        me.resources[resource] = (me.resources[resource] || 0) + amount;
        taken += amount;
      }
    });
  });

  resPanel?.updateResources?.(state.players);
  hud.showResult(`Monopoly: took ${taken} ${resource} from other players`);
  refreshScores?.();
  enableHUD(hud);
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
  hud.setBuyDevEnabled(false);
  hud.setPlayDevEnabled(false);
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
  hud.setBuyDevEnabled(true);
  hud.setPlayDevEnabled(true);
}
