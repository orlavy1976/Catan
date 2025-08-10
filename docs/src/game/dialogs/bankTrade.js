// docs/src/game/dialogs/bankTrade.js
// 🏦 Bank Trading System - Resource-First Selection UX

import { 
  createMaterialDialog, 
  createMaterialChoice,
  MATERIAL_DIALOG_TYPES 
} from '../../utils/materialDialog.js';
import { createMaterialButton, makeButton } from '../../catan/ui/materialButton.js';
import { 
  createMaterialText, 
  createMaterialHeadline 
} from '../../utils/materialUI.js';
import { MATERIAL_COLORS, MATERIAL_SPACING } from '../../config/materialDesign.js';
import { RES_KEYS } from '../../config/constants.js';

/**
 * Show bank trade dialog with resource-first selection UX
 * @param {object} deps - Dependencies (app, hud, state, resPanel, graph)
 */
export function showBankTradeDialog({ app, hud, state, resPanel, graph }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  const rates = computeEffectiveRatesForCurrentPlayer(state, graph);
  
  // Check if player has any tradeable resources
  const tradeableResources = RES_KEYS.filter(resource => {
    const rate = rates[resource];
    const available = currentPlayer.resources[resource];
    return available >= rate;
  });

  if (tradeableResources.length === 0) {
    showNoTradesAvailableDialog({ app, hud, state, resPanel, graph });
    return;
  }

  const dialog = createMaterialDialog(app, {
    title: "Bank Trade",
    type: MATERIAL_DIALOG_TYPES.LARGE,
    onClose: () => enableHUD(hud)
  });

  let currentY = 0;

  // Instructions
  const instructionText = createMaterialText(
    "Select a resource to trade away:",
    'bodyMedium'
  );
  instructionText.x = MATERIAL_SPACING[4];
  instructionText.y = currentY;
  dialog.contentArea.addChild(instructionText);
  currentY += 40;

  // Resource selection grid
  const resourceGrid = createResourceSelectionGrid(
    currentPlayer.resources,
    rates,
    (selectedResource) => {
      dialog.close();
      showResourceTradeOptions({
        app, hud, state, resPanel, graph,
        selectedResource,
        rate: rates[selectedResource],
        available: currentPlayer.resources[selectedResource]
      });
    }
  );
  
  resourceGrid.x = MATERIAL_SPACING[4];
  resourceGrid.y = currentY;
  dialog.contentArea.addChild(resourceGrid);
  currentY += resourceGrid.height + MATERIAL_SPACING[4];

  // Back button
  const backButton = makeButton("Back to Trade Menu", 180, 'secondary');
  backButton.container.x = (400 - 180) / 2; // Use fixed width for now
  backButton.container.y = currentY;
  backButton.onClick(() => {
    dialog.close();
    // Assuming there's a main trade menu function
    if (typeof showTradeMenu === 'function') {
      showTradeMenu({ app, hud, state, resPanel, graph });
    } else {
      enableHUD(hud);
    }
  });
  dialog.contentArea.addChild(backButton.container);

  disableHUD(hud);
  dialog.show();
}

/**
 * Show trade options for a selected resource
 * @param {object} params - Parameters
 */
function showResourceTradeOptions({ app, hud, state, resPanel, graph, selectedResource, rate, available }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  
  // Create list of possible trades
  const tradeOptions = RES_KEYS
    .filter(resource => resource !== selectedResource)
    .map(resource => ({
      label: `${rate} ${selectedResource} → 1 ${resource}`,
      value: { give: selectedResource, receive: resource, rate }
    }));

  // Use a larger dialog for trade options
  const dialog = createMaterialDialog(app, {
    title: `Trade ${selectedResource}`,
    type: MATERIAL_DIALOG_TYPES.LARGE,
    onClose: () => {
      // Go back to resource selection
      showBankTradeDialog({ app, hud, state, resPanel, graph });
    }
  });

  // Add message
  const messageText = createMaterialText(
    `You have ${available} ${selectedResource}. Choose what to receive:`,
    'bodyMedium'
  );
  messageText.x = MATERIAL_SPACING[4];
  messageText.y = 0;
  dialog.contentArea.addChild(messageText);

  // Create trade option buttons in a grid
  const buttonContainer = new PIXI.Container();
  const buttonWidth = 200;
  const buttonHeight = 40;
  const gap = MATERIAL_SPACING[2];
  const columns = 2;

  tradeOptions.forEach((option, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    const button = makeButton(option.label, buttonWidth, 'outlined');
    button.container.x = col * (buttonWidth + gap);
    button.container.y = row * (buttonHeight + gap);
    
    button.onClick(() => {
      executeBankTrade(currentPlayer, option.value);
      resPanel.updateResources(state.players);
      
      dialog.close();
      showTradeSuccessDialog(app, option.value, () => {
        enableHUD(hud);
      });
    });
    
    buttonContainer.addChild(button.container);
  });

  buttonContainer.x = MATERIAL_SPACING[4];
  buttonContainer.y = 50;
  dialog.contentArea.addChild(buttonContainer);

  // Cancel button
  const cancelButton = makeButton("Cancel", 120, 'text');
  cancelButton.container.x = (700 - 120) / 2; // Center in LARGE dialog
  cancelButton.container.y = 50 + (Math.ceil(tradeOptions.length / columns) * (buttonHeight + gap)) + MATERIAL_SPACING[4];
  cancelButton.onClick(() => {
    dialog.close();
    // Go back to resource selection
    showBankTradeDialog({ app, hud, state, resPanel, graph });
  });
  dialog.contentArea.addChild(cancelButton.container);

  disableHUD(hud);
  dialog.show();
}

/**
 * Create a resource selection grid
 * @param {object} resources - Player resources
 * @param {object} rates - Trading rates
 * @param {function} onSelect - Selection callback
 * @returns {PIXI.Container} Resource grid container
 */
function createResourceSelectionGrid(resources, rates, onSelect) {
  const container = new PIXI.Container();
  const columns = 3;
  const cardWidth = 80;
  const cardHeight = 100;
  const gap = MATERIAL_SPACING[3];

  let currentX = 0;
  let currentY = 0;
  let column = 0;

  RES_KEYS.forEach(resource => {
    const rate = rates[resource];
    const available = resources[resource] || 0;
    const canTrade = available >= rate;

    const resourceCard = createResourceCard(resource, available, rate, canTrade, () => {
      if (canTrade) {
        onSelect(resource);
      }
    });

    resourceCard.x = currentX;
    resourceCard.y = currentY;
    container.addChild(resourceCard);

    // Grid layout
    column++;
    if (column >= columns) {
      column = 0;
      currentX = 0;
      currentY += cardHeight + gap;
    } else {
      currentX += cardWidth + gap;
    }
  });

  container.height = currentY + cardHeight;
  return container;
}

/**
 * Create a resource card for selection
 * @param {string} resource - Resource type
 * @param {number} available - Available amount
 * @param {number} rate - Trade rate
 * @param {boolean} canTrade - Whether trading is possible
 * @param {function} onClick - Click callback
 * @returns {PIXI.Container} Resource card container
 */
function createResourceCard(resource, available, rate, canTrade, onClick) {
  const container = new PIXI.Container();
  
  // Background
  const bg = new PIXI.Graphics();
  const alpha = canTrade ? 1 : 0.4;
  const borderColor = canTrade ? MATERIAL_COLORS.primary[500] : MATERIAL_COLORS.neutral[600];
  
  bg.lineStyle(2, borderColor, alpha);
  bg.beginFill(MATERIAL_COLORS.surface.secondary, alpha);
  bg.drawRoundedRect(0, 0, 80, 100, 8);
  bg.endFill();
  container.addChild(bg);

  // Resource icon
  const iconBg = new PIXI.Graphics();
  iconBg.beginFill(MATERIAL_COLORS.resource?.[resource] || MATERIAL_COLORS.primary[500], alpha);
  iconBg.drawRoundedRect(15, 10, 50, 30, 6);
  iconBg.endFill();
  container.addChild(iconBg);

  // Resource letter
  const resourceLetter = createMaterialText(resource.charAt(0).toUpperCase(), 'sectionHeader');
  resourceLetter.x = 40;
  resourceLetter.y = 25;
  resourceLetter.anchor.set(0.5);
  resourceLetter.style.fill = 0xffffff;
  resourceLetter.alpha = alpha;
  container.addChild(resourceLetter);

  // Available amount
  const availableText = createMaterialText(`${available}`, 'bodyMedium');
  availableText.x = 40;
  availableText.y = 50;
  availableText.anchor.set(0.5, 0);
  availableText.alpha = alpha;
  container.addChild(availableText);

  // Trade rate
  const rateText = createMaterialText(`${rate}:1`, 'bodySmall');
  rateText.x = 40;
  rateText.y = 70;
  rateText.anchor.set(0.5, 0);
  rateText.style.fill = canTrade ? MATERIAL_COLORS.primary[500] : MATERIAL_COLORS.neutral[500];
  rateText.alpha = alpha;
  container.addChild(rateText);

  // Status text
  const statusText = createMaterialText(
    canTrade ? 'Available' : 'Need more',
    'bodySmall'
  );
  statusText.x = 40;
  statusText.y = 85;
  statusText.anchor.set(0.5, 0);
  statusText.style.fill = canTrade ? MATERIAL_COLORS.semantic.success : MATERIAL_COLORS.semantic.error;
  statusText.alpha = alpha;
  container.addChild(statusText);

  // Make interactive if tradeable
  if (canTrade) {
    container.eventMode = "static";
    container.cursor = "pointer";
    
    container.on("pointerover", () => {
      bg.clear();
      bg.lineStyle(3, MATERIAL_COLORS.primary[400]);
      bg.beginFill(MATERIAL_COLORS.primary[50], 0.8);
      bg.drawRoundedRect(0, 0, 80, 100, 8);
      bg.endFill();
    });

    container.on("pointerout", () => {
      bg.clear();
      bg.lineStyle(2, borderColor);
      bg.beginFill(MATERIAL_COLORS.surface.secondary);
      bg.drawRoundedRect(0, 0, 80, 100, 8);
      bg.endFill();
    });

    container.on("pointertap", onClick);
  }

  return container;
}

/**
 * Show no trades available dialog
 */
function showNoTradesAvailableDialog({ app, hud, state, resPanel, graph }) {
  const dialog = createMaterialDialog(app, {
    title: "Bank Trade",
    type: MATERIAL_DIALOG_TYPES.SMALL,
    onClose: () => enableHUD(hud)
  });

  const messageText = createMaterialText(
    "You don't have enough resources for any bank trades.",
    'bodyMedium'
  );
  messageText.x = MATERIAL_SPACING[4];
  messageText.y = 0;
  dialog.contentArea.addChild(messageText);

  const backButton = makeButton("Back", 120, 'primary');
  backButton.container.x = (400 - 120) / 2; // Use fixed width
  backButton.container.y = 60;
  backButton.onClick(() => {
    dialog.close();
    if (typeof showTradeMenu === 'function') {
      showTradeMenu({ app, hud, state, resPanel, graph });
    } else {
      enableHUD(hud);
    }
  });
  dialog.contentArea.addChild(backButton.container);

  disableHUD(hud);
  dialog.show();
}

/**
 * Show trade success dialog
 */
function showTradeSuccessDialog(app, tradeData, onClose) {
  const dialog = createMaterialDialog(app, {
    title: "Trade Successful! 🎉",
    type: MATERIAL_DIALOG_TYPES.SMALL,
    onClose
  });

  const messageText = createMaterialText(
    `Traded ${tradeData.rate} ${tradeData.give} for 1 ${tradeData.receive}!`,
    'bodyMedium'
  );
  messageText.x = MATERIAL_SPACING[4];
  messageText.y = 0;
  messageText.style.fill = MATERIAL_COLORS.semantic.success;
  dialog.contentArea.addChild(messageText);

  const continueButton = makeButton("Continue", 120, 'primary');
  continueButton.container.x = (400 - 120) / 2; // Use fixed width
  continueButton.container.y = 60;
  continueButton.onClick(() => {
    dialog.close();
    if (onClose) onClose();
  });
  dialog.contentArea.addChild(continueButton.container);

  dialog.show();
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Execute a bank trade
 * @param {object} player - Player object
 * @param {object} tradeData - Trade data {give, receive, rate}
 */
function executeBankTrade(player, tradeData) {
  player.resources[tradeData.give] -= tradeData.rate;
  player.resources[tradeData.receive] += 1;
}

/**
 * Compute effective trading rates for current player
 * @param {object} state - Game state
 * @param {object} graph - Board graph
 * @returns {object} Resource rates
 */
function computeEffectiveRatesForCurrentPlayer(state, graph) {
  // Simplified version - in real implementation this would check player's ports
  // For now return default rates
  return {
    brick: 4,
    wood: 4,
    wheat: 4,
    sheep: 4,
    ore: 4
  };
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
