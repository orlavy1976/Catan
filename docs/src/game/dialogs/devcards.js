// docs/src/game/dialogs/devcards.js
// 🃏 Development Card Dialog System
// Modern, design-system-based development card dialogs

import { 
  createDialog, 
  createResourceDialog,
  DIALOG_TYPES,
  DIALOG_ANIMATION 
} from "../../utils/dialog.js";
import { 
  SPACING, 
  COLORS,
} from "../../config/materialDesign.js";
import { 
  createMaterialText,
  createMaterialHeadline,
  createMaterialBody
} from "../../utils/materialUI.js";
import { 
  stackVertically,
  arrangeHorizontally 
} from "../../utils/ui.js";
import { makeButton } from "../../catan/ui/materialButton.js";
import { drawDevCardFace, pretty, prettyDesc } from "../devcards/ui.js";

// Development card effects
import { playKnight } from "../devcards/effects/knight.js";
import { playRoadBuilding } from "../devcards/effects/roadBuilding.js";
import { playYearOfPlenty } from "../devcards/effects/yearOfPlenty.js";
import { playMonopoly } from "../devcards/effects/monopoly.js";


/**
 * Show monopoly resource selection
 * @param {object} deps - Dependencies
 */
export function showMonopolyDialog(deps) {
  const { app, hud, state, resPanel, refreshScores } = deps;
  
  const dialog = createResourceDialog(app, {
    title: "Monopoly",
    subtitle: "Choose a resource to monopolize",
    resources: ['brick', 'wood', 'wheat', 'sheep', 'ore'],
    animation: DIALOG_ANIMATION.SCALE,
    onResourceSelect: (resource) => {
      executeMonopoly(resource, state, resPanel, hud, refreshScores);
    },
    onCancel: () => {
      enableHUD(hud);
    }
  });

  disableHUD(hud);
  dialog.show();
}

// ==================== YEAR OF PLENTY DIALOG ====================

/**
 * Show year of plenty resource selection
 * @param {object} deps - Dependencies
 */
export function showYearOfPlentyDialog(deps) {
  const { app, hud, state, resPanel, refreshScores } = deps;
  
  let selectedResources = [];
  
  const dialog = createDialog(app, {
    title: "Year of Plenty",
    subtitle: "Choose 2 resources from the bank",
    type: DIALOG_TYPES.MEDIUM,
    animation: DIALOG_ANIMATION.SCALE,
    closeOnOverlay: false,
    showCloseButton: false,
    onClose: () => enableHUD(hud)
  });

  let currentY = dialog.contentStartY;

  // Instructions
  const instructionText = createBodyText("Select 2 resources to receive from the bank:");
  instructionText.x = 0;
  instructionText.y = currentY;
  dialog.content.addChild(instructionText);
  currentY += instructionText.height + SPACING.lg;

  // Selected resources display
  const selectedContainer = new PIXI.Container();
  const selectedText = createMaterialText("Selected: None", 'bodyMedium');
  selectedText.x = 0;
  selectedText.y = 0;
  selectedContainer.addChild(selectedText);
  
  selectedContainer.x = 0;
  selectedContainer.y = currentY;
  dialog.content.addChild(selectedContainer);
  currentY += 30 + SPACING.lg;

  // Resource buttons
  const resources = ['brick', 'wood', 'wheat', 'sheep', 'ore'];
  const buttonContainer = new PIXI.Container();
  
  resources.forEach((resource, index) => {
    const button = makeButton(
      resource.charAt(0).toUpperCase() + resource.slice(1),
      100,
      'primary'
    );
    
    button.container.x = (index % 3) * 110;
    button.container.y = Math.floor(index / 3) * 50;
    
    button.onClick(() => {
      if (selectedResources.length < 2) {
        selectedResources.push(resource);
        updateSelectedDisplay();
      }
    });
    
    buttonContainer.addChild(button.container);
  });
  
  buttonContainer.x = (dialog.contentWidth - 320) / 2;
  buttonContainer.y = currentY;
  dialog.content.addChild(buttonContainer);
  currentY += 100 + SPACING.lg;

  // Action buttons
  const actionContainer = new PIXI.Container();
  const confirmButton = makeButton("Confirm", 120, 'primary');
  const clearButton = makeButton("Clear", 100, 'secondary');
  const cancelButton = makeButton("Cancel", 100, 'secondary');
  
  arrangeHorizontally([
    { container: cancelButton.container },
    { container: clearButton.container },
    { container: confirmButton.container }
  ], 0, SPACING.md);
  
  actionContainer.x = (dialog.contentWidth - 320 - (SPACING.md * 2)) / 2;
  actionContainer.y = currentY;
  
  actionContainer.addChild(cancelButton.container);
  actionContainer.addChild(clearButton.container);
  actionContainer.addChild(confirmButton.container);
  dialog.content.addChild(actionContainer);

  // Wire events
  confirmButton.onClick(() => {
    if (selectedResources.length === 2) {
      executeYearOfPlenty(selectedResources, state, resPanel, hud, refreshScores);
      dialog.close();
    }
  });

  clearButton.onClick(() => {
    selectedResources = [];
    updateSelectedDisplay();
  });

  cancelButton.onClick(() => {
    dialog.close();
  });

  function updateSelectedDisplay() {
    if (selectedResources.length === 0) {
      selectedText.text = "Selected: None";
      selectedText.style.fill = COLORS.text.muted;
    } else {
      selectedText.text = `Selected: ${selectedResources.join(', ')}`;
      selectedText.style.fill = COLORS.text.primary;
    }
    
    confirmButton.setEnabled(selectedResources.length === 2);
  }

  // Initial state
  updateSelectedDisplay();
  disableHUD(hud);
  dialog.show();
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
  const me = state.players[meIdx];
  let taken = 0;

  state.players.forEach((player, index) => {
    if (index === meIdx) return;
    
    const amount = player.resources[resource] || 0;
    if (amount > 0) {
      player.resources[resource] = 0;
      me.resources[resource] = (me.resources[resource] || 0) + amount;
      taken += amount;
    }
  });

  resPanel?.updateResources?.(state.players);
  hud.showResult(`Monopoly: took ${taken} ${resource} from other players`);
  refreshScores?.();
  enableHUD(hud);
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
  const me = state.players[state.currentPlayer - 1];
  
  resources.forEach(resource => {
    me.resources[resource] = (me.resources[resource] || 0) + 1;
  });

  resPanel?.updateResources?.(state.players);
  hud.showResult(`Year of Plenty: received ${resources.join(' and ')}`);
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
