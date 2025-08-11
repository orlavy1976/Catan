// docs/src/game/dialogs/playerTrade.js
// 👥 Player-to-Player Trading System

import { 
  createMaterialDialog, 
  createMaterialChoice,
  MATERIAL_DIALOG_TYPES 
} from '../../utils/materialDialog.js';
import { createMaterialButton } from '../../catan/ui/materialButton.js';
import { 
  createMaterialText, 
  createMaterialHeadline,
  createMaterialContainer,
  drawMaterialCard,
  animateScale
} from '../../utils/materialUI.js';
import { MATERIAL_COLORS, MATERIAL_SPACING } from '../../config/materialDesign.js';
import { RES_KEYS } from '../../config/constants.js';

/**
 * Show player trade dialog - select trading partner
 * @param {object} deps - Dependencies (app, hud, state, resPanel, graph, refreshHudAvailability)
 */
export function showPlayerTradeDialog({ app, hud, state, resPanel, graph, refreshHudAvailability }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  
  // Create a helper function that other nested functions can use
  const restoreHUD = () => {
    if (refreshHudAvailability) {
      refreshHudAvailability();
    }
  };
  
  // Make it available globally for nested functions (temporary solution)
  window._tempRestoreHUD = restoreHUD;
  const otherPlayers = state.players.filter(p => p.id !== currentPlayer.id);
  
  const choices = otherPlayers.map(player => ({
    label: `Player ${player.id} (${getTotalResources(player)} resources)`,
    value: player
  }));

  const dialog = createMaterialChoice(app, {
    title: "Player Trade",
    message: "Choose a player to trade with:",
    choices,
    onChoice: (targetPlayer) => {
      dialog.close();
      showTradeNegotiationDialog({ app, hud, state, resPanel, targetPlayer, graph, refreshHudAvailability });
    },
    onCancel: () => {
      // Go back to main trade menu
      if (typeof showTradeMenu === 'function') {
        showTradeMenu({ app, hud, state, resPanel, graph, refreshHudAvailability });
      } else {
        restoreHUD();
      }
    },
    onClose: () => {
      // Handle escape key or other close events
      restoreHUD();
    }
  });

  disableHUD(hud);
  dialog.show();
}

/**
 * Show trade negotiation interface
 * @param {object} params - Parameters
 */
function showTradeNegotiationDialog({ app, hud, state, resPanel, targetPlayer, graph, refreshHudAvailability }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  
  const dialog = createMaterialDialog(app, {
    title: `Trade with Player ${targetPlayer.id}`,
    type: MATERIAL_DIALOG_TYPES.LARGE,
    onClose: () => refreshHudAvailability()
  });

  // Trade state
  const tradeOffer = {
    give: { brick: 0, wood: 0, wheat: 0, sheep: 0, ore: 0 },
    receive: { brick: 0, wood: 0, wheat: 0, sheep: 0, ore: 0 }
  };

  let currentY = 0;

  // === SECTION: What you give ===
  const giveTitle = createMaterialHeadline("You give:", 'small');
  giveTitle.x = MATERIAL_SPACING[4];
  giveTitle.y = currentY;
  dialog.contentArea.addChild(giveTitle);
  currentY += 30;

  const giveContainer = createResourceSelector(currentPlayer.resources, tradeOffer.give, 'give');
  giveContainer.x = MATERIAL_SPACING[4];
  giveContainer.y = currentY;
  dialog.contentArea.addChild(giveContainer);
  currentY += 80;

  // === SECTION: What you receive ===
  const receiveTitle = createMaterialHeadline("You receive:", 'small');
  receiveTitle.x = MATERIAL_SPACING[4];
  receiveTitle.y = currentY;
  dialog.contentArea.addChild(receiveTitle);
  currentY += 30;

  const receiveContainer = createResourceSelector(targetPlayer.resources, tradeOffer.receive, 'receive');
  receiveContainer.x = MATERIAL_SPACING[4];
  receiveContainer.y = currentY;
  dialog.contentArea.addChild(receiveContainer);
  currentY += 100;

  // === TRADE SUMMARY ===
  const summaryContainer = new PIXI.Container();
  summaryContainer.x = MATERIAL_SPACING[4];
  summaryContainer.y = currentY;
  dialog.contentArea.addChild(summaryContainer);

  function updateTradeSummary() {
    summaryContainer.removeChildren();
    
    // Create summary card background
    const summaryBg = new PIXI.Graphics();
    drawMaterialCard(summaryBg, 360, 60, {
      elevation: 1,
      backgroundColor: MATERIAL_COLORS.surface.tertiary,
      borderRadius: 8
    });
    summaryContainer.addChild(summaryBg);
    
    const giveTotal = Object.values(tradeOffer.give).reduce((sum, count) => sum + count, 0);
    const receiveTotal = Object.values(tradeOffer.receive).reduce((sum, count) => sum + count, 0);
    
    let summaryText;
    let textColor = MATERIAL_COLORS.neutral[300];
    
    if (giveTotal === 0 && receiveTotal === 0) {
      summaryText = "💡 Select resources to trade";
      textColor = MATERIAL_COLORS.neutral[400];
    } else {
      summaryText = "📋 Trade Summary: ";
      if (giveTotal > 0) {
        const giveItems = RES_KEYS.filter(res => tradeOffer.give[res] > 0)
          .map(res => `${tradeOffer.give[res]} ${res}`);
        summaryText += `Give ${giveItems.join(", ")}`;
      }
      
      if (receiveTotal > 0) {
        const receiveItems = RES_KEYS.filter(res => tradeOffer.receive[res] > 0)
          .map(res => `${tradeOffer.receive[res]} ${res}`);
        if (giveTotal > 0) summaryText += " → ";
        summaryText += `Get ${receiveItems.join(", ")}`;
      }
      textColor = MATERIAL_COLORS.neutral[100];
    }

    const summaryTextObj = createMaterialText(summaryText, 'bodyMedium');
    summaryTextObj.x = MATERIAL_SPACING[3];
    summaryTextObj.y = 20;
    summaryTextObj.style.fill = textColor;
    summaryContainer.addChild(summaryTextObj);
  }

  currentY += 40;

  // === ACTION BUTTONS ===
  const buttonContainer = new PIXI.Container();
  buttonContainer.x = MATERIAL_SPACING[4];
  buttonContainer.y = currentY;
  dialog.contentArea.addChild(buttonContainer);

  const proposeButton = createMaterialButton("Propose Trade", {
    variant: 'filled',
    size: 'medium',
    width: 140
  });
  const cancelButton = createMaterialButton("Cancel", {
    variant: 'text',
    size: 'medium',
    width: 100
  });

  proposeButton.onClick(() => {
    const giveTotal = Object.values(tradeOffer.give).reduce((sum, count) => sum + count, 0);
    const receiveTotal = Object.values(tradeOffer.receive).reduce((sum, count) => sum + count, 0);
    
    if (giveTotal === 0 && receiveTotal === 0) {
      // Show error
      return;
    }

    if (!validateTradeOffer(currentPlayer, targetPlayer, tradeOffer)) {
      // Show error
      return;
    }

    dialog.close();
    showTradeResponseDialog({ app, hud, state, resPanel, currentPlayer, targetPlayer, tradeOffer, graph });
  });

  cancelButton.onClick(() => {
    dialog.close();
    showPlayerTradeDialog({ app, hud, state, resPanel, graph });
  });

  buttonContainer.addChild(proposeButton.container);
  cancelButton.container.x = 160;
  buttonContainer.addChild(cancelButton.container);

  // Initialize summary
  updateTradeSummary();

  // Wire up update callbacks for resource selectors
  giveContainer.onUpdate = updateTradeSummary;
  receiveContainer.onUpdate = updateTradeSummary;

  disableHUD(hud);
  dialog.show();
}

/**
 * Show trade response dialog with AI decision
 * @param {object} params - Parameters
 */
function showTradeResponseDialog({ app, hud, state, resPanel, currentPlayer, targetPlayer, tradeOffer, graph }) {
  // AI Decision Logic
  const aiDecision = evaluateTradeOffer(targetPlayer, currentPlayer, tradeOffer);
  
  const dialog = createMaterialDialog(app, {
    title: `Player ${targetPlayer.id} Response`,
    type: MATERIAL_DIALOG_TYPES.MEDIUM,
    onClose: () => window._tempRestoreHUD?.()
  });

  let currentY = 0;

  // Show trade summary
  const giveItems = RES_KEYS.filter(res => tradeOffer.give[res] > 0)
    .map(res => `${tradeOffer.give[res]} ${res}`);
  const receiveItems = RES_KEYS.filter(res => tradeOffer.receive[res] > 0)
    .map(res => `${tradeOffer.receive[res]} ${res}`);

  const summaryText = `Proposed Trade:\nYou give: ${giveItems.join(", ")}\nYou get: ${receiveItems.join(", ")}`;
  const summary = createMaterialText(summaryText, 'bodyMedium');
  summary.x = MATERIAL_SPACING[4];
  summary.y = currentY;
  dialog.contentArea.addChild(summary);

  currentY += 100;

  // AI "thinking" animation
  const thinkingText = createMaterialText(`Player ${targetPlayer.id} is considering your offer...`, 'bodyMedium');
  thinkingText.x = MATERIAL_SPACING[4];
  thinkingText.y = currentY;
  thinkingText.style.fill = MATERIAL_COLORS.neutral[400];
  dialog.contentArea.addChild(thinkingText);

  // Show AI decision after a delay
  setTimeout(() => {
    dialog.close();
    if (aiDecision.accepted) {
      showTradeAcceptedDialog({ app, hud, state, resPanel, currentPlayer, targetPlayer, tradeOffer, aiDecision });
    } else {
      showTradeRejectedDialog({ app, hud, state, resPanel, currentPlayer, targetPlayer, tradeOffer, aiDecision, graph });
    }
  }, 1500); // 1.5 second "thinking" time

  disableHUD(hud);
  dialog.show();
}

/**
 * AI evaluation of trade offer
 */
function evaluateTradeOffer(aiPlayer, humanPlayer, tradeOffer) {
  let score = 0;
  let reasons = [];

  // Simple AI logic - mostly accepts reasonable trades
  const giveTotal = Object.values(tradeOffer.give).reduce((sum, count) => sum + count, 0);
  const receiveTotal = Object.values(tradeOffer.receive).reduce((sum, count) => sum + count, 0);
  
  // Prefer roughly equal trades
  const balance = Math.abs(giveTotal - receiveTotal);
  score -= balance * 2;
  
  // Random factor
  const randomFactor = (Math.random() - 0.3) * 6; // Slightly biased toward accepting
  score += randomFactor;

  const accepted = score > -2; // More lenient acceptance
  const reason = accepted ? 
    "Looks like a fair trade!" :
    balance > 2 ? "Trade seems unbalanced" : "Not what I need right now";

  return { accepted, reason, score: Math.round(score * 10) / 10 };
}

/**
 * Show trade accepted dialog
 */
function showTradeAcceptedDialog({ app, hud, state, resPanel, currentPlayer, targetPlayer, tradeOffer, aiDecision }) {
  const dialog = createMaterialDialog(app, {
    title: "Trade Accepted! 🎉",
    type: MATERIAL_DIALOG_TYPES.MEDIUM,
    onClose: () => window._tempRestoreHUD?.()
  });

  let currentY = 0;

  // Success message
  const successText = createMaterialText(
    `Player ${targetPlayer.id} says: "${aiDecision.reason}"\n\nThe trade has been completed!`,
    'bodyMedium'
  );
  successText.x = MATERIAL_SPACING[4];
  successText.y = currentY;
  successText.style.fill = MATERIAL_COLORS.semantic.success;
  dialog.contentArea.addChild(successText);

  currentY += 80;

  // Trade details
  const giveItems = RES_KEYS.filter(res => tradeOffer.give[res] > 0)
    .map(res => `${tradeOffer.give[res]} ${res}`);
  const receiveItems = RES_KEYS.filter(res => tradeOffer.receive[res] > 0)
    .map(res => `${tradeOffer.receive[res]} ${res}`);

  const detailsText = `You gave: ${giveItems.join(", ")}\nYou received: ${receiveItems.join(", ")}`;
  const details = createMaterialText(detailsText, 'bodyMedium');
  details.x = MATERIAL_SPACING[4];
  details.y = currentY;
  dialog.contentArea.addChild(details);

  currentY += 80;

  // Continue button
  const continueButton = createMaterialButton("Continue", {
    variant: 'filled',
    size: 'medium',
    width: 120
  });
  continueButton.container.x = (400 - 120) / 2;
  continueButton.container.y = currentY;
  
  continueButton.onClick(() => {
    // Execute the trade
    executePlayerTrade(currentPlayer, targetPlayer, tradeOffer);
    resPanel.updateResources(state.players);
    
    // Close dialog and re-enable HUD
    dialog.close();
    setTimeout(() => {
      window._tempRestoreHUD?.();
    }, 100);
  });

  dialog.contentArea.addChild(continueButton.container);

  disableHUD(hud);
  dialog.show();
}

/**
 * Show trade rejected dialog
 */
function showTradeRejectedDialog({ app, hud, state, resPanel, currentPlayer, targetPlayer, tradeOffer, aiDecision, graph }) {
  const dialog = createMaterialDialog(app, {
    title: "Trade Rejected 😞",
    type: MATERIAL_DIALOG_TYPES.MEDIUM,
    onClose: () => window._tempRestoreHUD?.()
  });

  let currentY = 0;

  // Rejection message
  const rejectionText = createMaterialText(
    `Player ${targetPlayer.id} says: "${aiDecision.reason}"\n\nMaybe try a different offer?`,
    'bodyMedium'
  );
  rejectionText.x = MATERIAL_SPACING[4];
  rejectionText.y = currentY;
  rejectionText.style.fill = MATERIAL_COLORS.semantic.error;
  dialog.contentArea.addChild(rejectionText);

  currentY += 100;

  // Action buttons
  const buttonContainer = new PIXI.Container();
  buttonContainer.x = MATERIAL_SPACING[4];
  buttonContainer.y = currentY;
  dialog.contentArea.addChild(buttonContainer);

  const tryAgainButton = createMaterialButton("Try Different Trade", {
    variant: 'filled',
    size: 'medium',
    width: 180
  });
  const cancelButton = createMaterialButton("Cancel", {
    variant: 'text',
    size: 'medium',
    width: 100
  });

  tryAgainButton.onClick(() => {
    dialog.close();
    setTimeout(() => {
      showTradeNegotiationDialog({ app, hud, state, resPanel, targetPlayer, graph, refreshHudAvailability: window._tempRestoreHUD });
    }, 100);
  });

  cancelButton.onClick(() => {
    dialog.close();
    setTimeout(() => {
      window._tempRestoreHUD?.();
    }, 100);
  });

  buttonContainer.addChild(tryAgainButton.container);
  cancelButton.container.x = 200;
  buttonContainer.addChild(cancelButton.container);

  disableHUD(hud);
  dialog.show();
}

/**
 * Execute a player-to-player trade
 */
function executePlayerTrade(giver, receiver, tradeOffer) {
  // Transfer resources from giver to receiver
  RES_KEYS.forEach(resource => {
    if (tradeOffer.give[resource] > 0) {
      giver.resources[resource] -= tradeOffer.give[resource];
      receiver.resources[resource] += tradeOffer.give[resource];
    }
  });
  
  // Transfer resources from receiver to giver
  RES_KEYS.forEach(resource => {
    if (tradeOffer.receive[resource] > 0) {
      receiver.resources[resource] -= tradeOffer.receive[resource];
      giver.resources[resource] += tradeOffer.receive[resource];
    }
  });
}

// Add other functions like createResourceSelector, showTradeResponseDialog, etc.
// (These would be similar to the ones in the original trade.js but cleaner)

/**
 * Create a resource selector interface
 * @param {object} playerResources - Available resources for the player
 * @param {object} selection - Current selection object to modify
 * @param {string} mode - 'give' or 'receive'
 * @returns {PIXI.Container} Resource selector container
 */
function createResourceSelector(playerResources, selection, mode) {
  const container = new PIXI.Container();
  let currentX = 0;

  RES_KEYS.forEach(resourceType => {
    const resourceContainer = new PIXI.Container();
    
    // Resource card background using Material Design
    const cardBg = new PIXI.Graphics();
    drawMaterialCard(cardBg, 55, 80, {
      elevation: 1,
      backgroundColor: MATERIAL_COLORS.surface.secondary,
      borderRadius: 8
    });
    resourceContainer.addChild(cardBg);
    
    // Resource icon background
    const iconBg = new PIXI.Graphics();
    const resourceColor = MATERIAL_COLORS.resource?.[resourceType] || MATERIAL_COLORS.primary[500];
    iconBg.beginFill(resourceColor);
    iconBg.drawRoundedRect(7.5, 5, 40, 25, 4);
    iconBg.endFill();
    resourceContainer.addChild(iconBg);

    // Resource type label
    const typeLabel = createMaterialText(resourceType.charAt(0).toUpperCase(), 'bodyMedium');
    typeLabel.x = 27.5;
    typeLabel.y = 17.5;
    typeLabel.anchor.set(0.5);
    typeLabel.style.fill = 0xffffff;
    resourceContainer.addChild(typeLabel);

    // Available count (only for 'give' mode)
    if (mode === 'give') {
      const availableText = createMaterialText(`(${playerResources[resourceType]})`, 'bodySmall');
      availableText.x = 27.5;
      availableText.y = 32;
      availableText.anchor.set(0.5, 0);
      availableText.style.fill = MATERIAL_COLORS.neutral[400];
      resourceContainer.addChild(availableText);
    }

    // Selection controls
    const controlsContainer = new PIXI.Container();
    controlsContainer.y = mode === 'give' ? 45 : 35;
    resourceContainer.addChild(controlsContainer);

    // Minus button
    const minusBtn = createSmallButton("-", () => {
      if (selection[resourceType] > 0) {
        selection[resourceType]--;
        updateSelectionDisplay();
        if (container.onUpdate) container.onUpdate();
      }
    });
    minusBtn.x = 5;
    controlsContainer.addChild(minusBtn);

    // Count display
    const countText = createMaterialText("0", 'bodyMedium');
    countText.x = 27.5;
    countText.y = 7;
    countText.anchor.set(0.5, 0);
    countText.style.fill = MATERIAL_COLORS.primary[500];
    controlsContainer.addChild(countText);

    // Plus button
    const plusBtn = createSmallButton("+", () => {
      const maxAllowed = mode === 'give' ? playerResources[resourceType] : 10; // Reasonable max for receive
      if (selection[resourceType] < maxAllowed) {
        selection[resourceType]++;
        updateSelectionDisplay();
        if (container.onUpdate) container.onUpdate();
      }
    });
    plusBtn.x = 40;
    controlsContainer.addChild(plusBtn);

    function updateSelectionDisplay() {
      countText.text = selection[resourceType].toString();
      
      // Update button states
      minusBtn.alpha = selection[resourceType] > 0 ? 1 : 0.5;
      const maxAllowed = mode === 'give' ? playerResources[resourceType] : 10;
      plusBtn.alpha = selection[resourceType] < maxAllowed ? 1 : 0.5;
    }

    updateSelectionDisplay();

    resourceContainer.x = currentX;
    container.addChild(resourceContainer);
    currentX += 65; // Increased spacing for larger cards
  });

  return container;
}

/**
 * Create a small button for resource selection with Material Design styling
 * @param {string} label - Button label
 * @param {function} onClick - Click handler
 * @returns {PIXI.Container} Button container
 */
function createSmallButton(label, onClick) {
  const container = new PIXI.Container();
  
  // Background using Material Design card
  const bg = new PIXI.Graphics();
  drawMaterialCard(bg, 15, 15, {
    elevation: 1,
    backgroundColor: MATERIAL_COLORS.primary[500],
    borderRadius: 4
  });
  container.addChild(bg);

  const text = createMaterialText(label, 'bodySmall');
  text.x = 7.5;
  text.y = 7.5;
  text.anchor.set(0.5);
  text.style.fill = 0xffffff;
  text.style.fontSize = 10; // Smaller for the tiny button
  container.addChild(text);

  container.eventMode = "static";
  container.cursor = "pointer";
  
  container.on("pointerover", () => {
    animateScale(container, 1.1, 100);
    bg.clear();
    drawMaterialCard(bg, 15, 15, {
      elevation: 2,
      backgroundColor: MATERIAL_COLORS.primary[400],
      borderRadius: 4
    });
  });

  container.on("pointerout", () => {
    animateScale(container, 1, 100);
    bg.clear();
    drawMaterialCard(bg, 15, 15, {
      elevation: 1,
      backgroundColor: MATERIAL_COLORS.primary[500],
      borderRadius: 4
    });
  });

  container.on("pointertap", onClick);
  
  return container;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get total resources for a player
 * @param {object} player - Player object
 * @returns {number} Total resource count
 */
function getTotalResources(player) {
  return Object.values(player.resources).reduce((sum, count) => sum + count, 0);
}

/**
 * Validate if a trade offer is possible
 * @param {object} giver - Player giving resources
 * @param {object} receiver - Player receiving resources
 * @param {object} tradeOffer - Trade offer {give, receive}
 * @returns {boolean} Whether trade is valid
 */
function validateTradeOffer(giver, receiver, tradeOffer) {
  // Check if giver has enough resources
  for (const resource of RES_KEYS) {
    if (giver.resources[resource] < tradeOffer.give[resource]) {
      return false;
    }
  }
  
  // Check if receiver has enough resources
  for (const resource of RES_KEYS) {
    if (receiver.resources[resource] < tradeOffer.receive[resource]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Disable HUD buttons during dialog
 * @param {object} hud - HUD instance
 */
function disableHUD(hud) {
  hud.setRollEnabled(false);
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);
  hud.setBuyDevEnabled(false);
  hud.setPlayDevEnabled(false);
}

/**
 * Temporary enableHUD that calls refreshHudAvailability if available
 * TODO: Remove this and pass refreshHudAvailability properly through call stack
 */
function enableHUD(hud) {
  // For now, just enable the basic buttons since we need to refactor this properly
  hud.setRollEnabled(true);
  hud.setEndEnabled(true);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(true);
  hud.setBuyDevEnabled(false);
  hud.setPlayDevEnabled(false);
}
