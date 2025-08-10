import { 
  createMaterialDialog, 
  createMaterialChoice, 
  createMaterialConfirm, 
  MATERIAL_DIALOG_TYPES 
} from '../../utils/materialDialog.js';
import { createMaterialButton } from '../../catan/ui/materialButton.js';
import { createMaterialText } from '../../utils/materialUI.js';
import { COLORS, SPACING } from '../../config/design.js';
import { RES_KEYS } from '../../config/constants.js';

// ==================== TRADE MENU DIALOG ====================

/**
 * Show main trade menu with options for bank and player trading
 * @param {object} deps - Dependencies (app, hud, state, resPanel, graph)
 */
export function showTradeMenu({ app, hud, state, resPanel, graph }) {
  const dialog = createMaterialChoice(app, {
    title: "Trade",
    message: "Choose your trading partner",
    choices: [
      { label: "Trade with Bank", value: "bank" },
      { label: "Trade with Player", value: "player" }
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

// ==================== BANK TRADE DIALOG ====================

/**
 * Show bank trade dialog with resource exchange
 * @param {object} deps - Dependencies (app, hud, state, resPanel, graph)
 */
export function showBankTradeDialog({ app, hud, state, resPanel, graph }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  const rates = computeEffectiveRatesForCurrentPlayer(state, graph);
  
  // Create array of available trade options
  const tradeOptions = [];
  
  RES_KEYS.forEach(giveResource => {
    const rate = rates[giveResource];
    const available = currentPlayer.resources[giveResource];
    
    if (available >= rate) {
      RES_KEYS.forEach(receiveResource => {
        if (giveResource !== receiveResource) {
          tradeOptions.push({
            label: `${rate} ${giveResource} → 1 ${receiveResource}`,
            value: { give: giveResource, receive: receiveResource, rate }
          });
        }
      });
    }
  });

  if (tradeOptions.length === 0) {
    // No trades available
    const dialog = createMaterialDialog(app, {
      title: "Bank Trade",
      type: MATERIAL_DIALOG_TYPES.SMALL,
      onClose: () => enableHUD(hud)
    });
    
    dialog.addContent(createMaterialText("No trades available", 'bodyLarge'));

    const messageText = createStyledText(
      "You don't have enough resources for any bank trades.",
      'body'
    );
    messageText.x = 0;
    messageText.y = dialog.contentStartY;
    dialog.content.addChild(messageText);

    const backButton = makeButton("Back", 120, 'primary');
    backButton.container.x = (dialog.contentWidth - 120) / 2;
    backButton.container.y = dialog.contentStartY + 60;
    backButton.onClick(() => {
      dialog.close();
      showTradeMenu({ app, hud, state, resPanel, graph });
    });
    dialog.content.addChild(backButton.container);
    
    disableHUD(hud);
    dialog.show();
    return;
  }

  // Show trade selection
  const dialog = createChoiceDialog(app, {
    title: "Bank Trade",
    subtitle: "Choose a trade to make",
    choices: tradeOptions.map(option => ({
      label: option.label,
      value: option.value
    })),
    onChoice: (tradeData) => {
      executeBankTrade(currentPlayer, tradeData);
      resPanel.updateResources(state.players);
      
      dialog.close();
      showTradeSuccessMessage(app, `Traded ${tradeData.rate} ${tradeData.give} for 1 ${tradeData.receive}!`);
      enableHUD(hud);
    },
    onCancel: () => {
      showTradeMenu({ app, hud, state, resPanel, graph });
    }
  });

  disableHUD(hud);
  dialog.show();
}

/**
 * Execute a bank trade
 * @param {object} player - Player object
 * @param {object} tradeData - Trade data {give, receive, rate}
 */
function executeBankTrade(player, tradeData) {
  player.resources[tradeData.give] -= tradeData.rate;
  player.resources[tradeData.receive] += 1;
}

// ==================== PLAYER TRADE DIALOG ====================

export function showPlayerTradeDialog({ app, hud, state, resPanel, graph }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  const otherPlayers = state.players.filter(p => p.id !== currentPlayer.id);
  
  const dialog = createDialog(app, {
    title: "Player Trade",
    subtitle: "Select a player to trade with",
    type: DIALOG_TYPES.LARGE,
    onClose: () => enableHUD(hud)
  });

  // Create player selection buttons
  const playerContainer = new PIXI.Container();
  let currentY = 0;

  otherPlayers.forEach((player, index) => {
    const playerButton = createPlayerTradeButton(player, () => {
      console.log("Player button clicked for player", player.id);
      dialog.close();
      showTradeNegotiationDialog({ app, hud, state, resPanel, targetPlayer: player, graph });
    });
    
    playerButton.y = currentY;
    playerContainer.addChild(playerButton);
    currentY += 70; // Height + gap
  });

  // Center player container
  playerContainer.x = (dialog.contentWidth - playerContainer.width) / 2;
  playerContainer.y = dialog.contentStartY;
  dialog.content.addChild(playerContainer);

  // Back button
  const backButton = makeButton("Back to Trade Menu", 200, 'secondary');
  backButton.container.x = (dialog.contentWidth - 200) / 2;
  backButton.container.y = dialog.contentStartY + playerContainer.height + SPACING.lg;
  dialog.content.addChild(backButton.container);
  
  backButton.onClick(() => {
    dialog.close();
    showTradeMenu({ app, hud, state, resPanel, graph });
  });

  disableHUD(hud);
  dialog.show();
}

/**
 * Show trade negotiation dialog with full resource selection interface
 * @param {object} params - Parameters {app, hud, state, resPanel, targetPlayer, graph}
 */
function showTradeNegotiationDialog({ app, hud, state, resPanel, targetPlayer, graph }) {
  console.log("Opening trade negotiation with player", targetPlayer.id);
  
  const currentPlayer = state.players[state.currentPlayer - 1];
  
  const dialog = createDialog(app, {
    title: `Trade with Player ${targetPlayer.id}`,
    subtitle: "Select resources to exchange",
    type: DIALOG_TYPES.LARGE,
    onClose: () => enableHUD(hud)
  });

  // Trade state
  const tradeOffer = {
    give: { brick: 0, wood: 0, wheat: 0, sheep: 0, ore: 0 },
    receive: { brick: 0, wood: 0, wheat: 0, sheep: 0, ore: 0 }
  };

  let currentY = dialog.contentStartY + SPACING.sm;

  // === SECTION: What you give ===
  const giveTitle = createStyledText("You give:", 'subtitle');
  giveTitle.x = SPACING.md;
  giveTitle.y = currentY;
  dialog.content.addChild(giveTitle);
  currentY += 30;

  const giveContainer = createResourceSelector(currentPlayer.resources, tradeOffer.give, 'give');
  giveContainer.x = SPACING.md;
  giveContainer.y = currentY;
  dialog.content.addChild(giveContainer);
  currentY += 80;

  // === SECTION: What you receive ===
  const receiveTitle = createStyledText("You receive:", 'subtitle');
  receiveTitle.x = SPACING.md;
  receiveTitle.y = currentY;
  dialog.content.addChild(receiveTitle);
  currentY += 30;

  const receiveContainer = createResourceSelector(targetPlayer.resources, tradeOffer.receive, 'receive');
  receiveContainer.x = SPACING.md;
  receiveContainer.y = currentY;
  dialog.content.addChild(receiveContainer);
  currentY += 100;

  // === TRADE SUMMARY ===
  const summaryContainer = new PIXI.Container();
  summaryContainer.x = SPACING.md;
  summaryContainer.y = currentY;
  dialog.content.addChild(summaryContainer);

  function updateTradeSummary() {
    summaryContainer.removeChildren();
    
    const giveTotal = Object.values(tradeOffer.give).reduce((sum, count) => sum + count, 0);
    const receiveTotal = Object.values(tradeOffer.receive).reduce((sum, count) => sum + count, 0);
    
    if (giveTotal === 0 && receiveTotal === 0) {
      const emptyText = createStyledText("Select resources to trade", 'body');
      emptyText.style.fill = COLORS.text.secondary;
      summaryContainer.addChild(emptyText);
      return;
    }

    let summaryText = "Trade Summary: ";
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
    
    const summary = createStyledText(summaryText, 'body');
    summaryContainer.addChild(summary);
  }

  currentY += 40;

  // === ACTION BUTTONS ===
  const buttonContainer = new PIXI.Container();
  buttonContainer.x = SPACING.md;
  buttonContainer.y = currentY;
  dialog.content.addChild(buttonContainer);

  const proposeButton = makeButton("Propose Trade", 140, 'primary');
  const cancelButton = makeButton("Cancel", 100, 'secondary');

  proposeButton.onClick(() => {
    const giveTotal = Object.values(tradeOffer.give).reduce((sum, count) => sum + count, 0);
    const receiveTotal = Object.values(tradeOffer.receive).reduce((sum, count) => sum + count, 0);
    
    if (giveTotal === 0 && receiveTotal === 0) {
      alert("Please select resources to trade");
      return;
    }

    if (!validateTradeOffer(currentPlayer, targetPlayer, tradeOffer)) {
      alert("Invalid trade: Not enough resources");
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

// ==================== UTILITY FUNCTIONS ====================

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
    
    // Resource icon background
    const iconBg = new PIXI.Graphics();
    iconBg.beginFill(COLORS.resource[resourceType] || COLORS.ui.primary);
    iconBg.drawRoundedRect(0, 0, 40, 40, 4);
    iconBg.endFill();
    resourceContainer.addChild(iconBg);

    // Resource type label
    const typeLabel = createStyledText(resourceType.charAt(0).toUpperCase(), 'subtitle');
    typeLabel.x = 15;
    typeLabel.y = 12;
    typeLabel.style.fill = 0xffffff;
    resourceContainer.addChild(typeLabel);

    // Available count (only for 'give' mode)
    if (mode === 'give') {
      const availableText = createStyledText(`(${playerResources[resourceType]})`, 'caption');
      availableText.x = 0;
      availableText.y = 45;
      availableText.style.fontSize = 10;
      resourceContainer.addChild(availableText);
    }

    // Selection controls
    const controlsContainer = new PIXI.Container();
    controlsContainer.y = mode === 'give' ? 60 : 45;
    resourceContainer.addChild(controlsContainer);

    // Minus button
    const minusBtn = createSmallButton("-", () => {
      if (selection[resourceType] > 0) {
        selection[resourceType]--;
        updateSelectionDisplay();
        if (container.onUpdate) container.onUpdate();
      }
    });
    controlsContainer.addChild(minusBtn);

    // Count display
    const countText = createStyledText("0", 'body');
    countText.x = 25;
    countText.y = 2;
    countText.anchor.set(0.5, 0);
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
    plusBtn.x = 35;
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
    currentX += 70;
  });

  return container;
}

/**
 * Create a small button for resource selection
 * @param {string} label - Button label
 * @param {function} onClick - Click handler
 * @returns {PIXI.Container} Button container
 */
function createSmallButton(label, onClick) {
  const container = new PIXI.Container();
  
  const bg = new PIXI.Graphics();
  bg.beginFill(COLORS.ui.primary);
  bg.drawRoundedRect(0, 0, 15, 15, 2);
  bg.endFill();
  container.addChild(bg);

  const text = createStyledText(label, 'caption');
  text.x = 7.5;
  text.y = 7.5;
  text.anchor.set(0.5);
  text.style.fill = 0xffffff;
  text.style.fontSize = 10;
  container.addChild(text);

  container.eventMode = "static";
  container.cursor = "pointer";
  
  container.on("pointerover", () => {
    bg.clear();
    bg.beginFill(COLORS.ui.hover);
    bg.drawRoundedRect(0, 0, 15, 15, 2);
    bg.endFill();
  });

  container.on("pointerout", () => {
    bg.clear();
    bg.beginFill(COLORS.ui.primary);
    bg.drawRoundedRect(0, 0, 15, 15, 2);
    bg.endFill();
  });

  container.on("pointertap", onClick);
  
  return container;
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
 * Show trade response dialog with AI decision
 * @param {object} params - Parameters
 */
function showTradeResponseDialog({ app, hud, state, resPanel, currentPlayer, targetPlayer, tradeOffer, graph }) {
  // AI Decision Logic
  const aiDecision = evaluateTradeOffer(targetPlayer, currentPlayer, tradeOffer);
  
  const dialog = createDialog(app, {
    title: `Player ${targetPlayer.id} Response`,
    subtitle: "Trade proposal evaluation",
    type: DIALOG_TYPES.MEDIUM,
    onClose: () => enableHUD(hud)
  });

  let currentY = dialog.contentStartY + SPACING.md;

  // Show trade summary
  const giveItems = RES_KEYS.filter(res => tradeOffer.give[res] > 0)
    .map(res => `${tradeOffer.give[res]} ${res}`);
  const receiveItems = RES_KEYS.filter(res => tradeOffer.receive[res] > 0)
    .map(res => `${tradeOffer.receive[res]} ${res}`);

  const summaryText = `Proposed Trade:\nYou give: ${giveItems.join(", ")}\nYou get: ${receiveItems.join(", ")}`;
  const summary = createStyledText(summaryText, 'body');
  summary.x = SPACING.md;
  summary.y = currentY;
  dialog.content.addChild(summary);

  currentY += 100;

  // AI "thinking" animation
  const thinkingText = createStyledText(`Player ${targetPlayer.id} is considering your offer...`, 'body');
  thinkingText.x = SPACING.md;
  thinkingText.y = currentY;
  thinkingText.style.fill = COLORS.text.secondary;
  dialog.content.addChild(thinkingText);

  currentY += 60;

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
 * @param {object} aiPlayer - AI player evaluating the trade
 * @param {object} humanPlayer - Human player making the offer
 * @param {object} tradeOffer - Trade offer {give, receive}
 * @returns {object} Decision {accepted: boolean, reason: string, score: number}
 */
function evaluateTradeOffer(aiPlayer, humanPlayer, tradeOffer) {
  let score = 0;
  let reasons = [];

  // Calculate resource values for AI
  const aiResourceNeeds = calculateResourceNeeds(aiPlayer);
  const aiResourceSurplus = calculateResourceSurplus(aiPlayer);

  // Evaluate what AI is giving (what human receives)
  RES_KEYS.forEach(resource => {
    const amount = tradeOffer.receive[resource];
    if (amount > 0) {
      if (aiResourceSurplus[resource] > 0) {
        score += amount * 2; // Happy to trade surplus
        reasons.push(`Has surplus ${resource}`);
      } else if (aiResourceNeeds[resource] > 0) {
        score -= amount * 3; // Reluctant to give needed resources
        reasons.push(`Needs ${resource}`);
      } else {
        score -= amount * 1; // Neutral about giving
      }
    }
  });

  // Evaluate what AI is receiving (what human gives)
  RES_KEYS.forEach(resource => {
    const amount = tradeOffer.give[resource];
    if (amount > 0) {
      if (aiResourceNeeds[resource] > 0) {
        score += amount * 3; // Very happy to get needed resources
        reasons.push(`Wants ${resource}`);
      } else if (aiResourceSurplus[resource] > 0) {
        score += amount * 1; // Still useful but not priority
      } else {
        score += amount * 2; // Generally useful
      }
    }
  });

  // Resource count balance (prefer roughly equal trades)
  const giveTotal = Object.values(tradeOffer.give).reduce((sum, count) => sum + count, 0);
  const receiveTotal = Object.values(tradeOffer.receive).reduce((sum, count) => sum + count, 0);
  const balance = Math.abs(giveTotal - receiveTotal);
  score -= balance * 2; // Penalty for unbalanced trades

  // Random factor (10-30% variation)
  const randomFactor = (Math.random() - 0.5) * 6;
  score += randomFactor;

  // Generosity factor (some players are more willing to trade)
  const generosity = Math.random() * 4 - 2; // -2 to +2
  score += generosity;

  const accepted = score > 0;
  const reason = accepted ? 
    `Accepted: ${reasons.slice(0, 2).join(", ")}` :
    `Rejected: ${balance > 2 ? "Unbalanced trade" : reasons.slice(0, 1).join(", ") || "Not beneficial"}`;

  return { accepted, reason, score: Math.round(score * 10) / 10 };
}

/**
 * Calculate which resources the AI player needs most
 * @param {object} player - Player object
 * @returns {object} Resource needs scores
 */
function calculateResourceNeeds(player) {
  const needs = { brick: 0, wood: 0, wheat: 0, sheep: 0, ore: 0 };
  
  // Basic needs - always want some of each resource
  RES_KEYS.forEach(resource => {
    if (player.resources[resource] === 0) {
      needs[resource] += 3; // Really need if have none
    } else if (player.resources[resource] < 2) {
      needs[resource] += 2; // Want more if have very few
    } else if (player.resources[resource] < 4) {
      needs[resource] += 1; // Moderate need
    }
  });

  // Building needs (simplified - in real game would check building positions)
  if (player.settlements?.length < 4) {
    needs.brick += 2;
    needs.wood += 2;
    needs.wheat += 2;
    needs.sheep += 2;
  }
  
  if (player.cities?.length < 2) {
    needs.wheat += 2;
    needs.ore += 3;
  }

  return needs;
}

/**
 * Calculate which resources the AI player has in surplus
 * @param {object} player - Player object
 * @returns {object} Resource surplus scores
 */
function calculateResourceSurplus(player) {
  const surplus = { brick: 0, wood: 0, wheat: 0, sheep: 0, ore: 0 };
  
  RES_KEYS.forEach(resource => {
    const count = player.resources[resource];
    if (count > 6) {
      surplus[resource] = 3; // High surplus
    } else if (count > 4) {
      surplus[resource] = 2; // Moderate surplus
    } else if (count > 2) {
      surplus[resource] = 1; // Small surplus
    }
  });

  return surplus;
}

/**
 * Show trade accepted dialog
 * @param {object} params - Parameters
 */
function showTradeAcceptedDialog({ app, hud, state, resPanel, currentPlayer, targetPlayer, tradeOffer, aiDecision }) {
  const dialog = createDialog(app, {
    title: "Trade Accepted! 🎉",
    subtitle: `Player ${targetPlayer.id} accepted your trade`,
    type: DIALOG_TYPES.MEDIUM,
    onClose: () => enableHUD(hud)
  });

  let currentY = dialog.contentStartY + SPACING.md;

  // Success message
  const successText = createStyledText(
    `Player ${targetPlayer.id} says: "${aiDecision.reason}"\n\nThe trade has been completed!`,
    'body'
  );
  successText.x = SPACING.md;
  successText.y = currentY;
  successText.style.fill = COLORS.text.success;
  dialog.content.addChild(successText);

  currentY += 80;

  // Trade details
  const giveItems = RES_KEYS.filter(res => tradeOffer.give[res] > 0)
    .map(res => `${tradeOffer.give[res]} ${res}`);
  const receiveItems = RES_KEYS.filter(res => tradeOffer.receive[res] > 0)
    .map(res => `${tradeOffer.receive[res]} ${res}`);

  const detailsText = `You gave: ${giveItems.join(", ")}\nYou received: ${receiveItems.join(", ")}`;
  const details = createStyledText(detailsText, 'body');
  details.x = SPACING.md;
  details.y = currentY;
  dialog.content.addChild(details);

  currentY += 80;

  // Continue button
  const continueButton = makeButton("Continue", 120, 'primary');
  continueButton.container.x = (dialog.contentWidth - 120) / 2;
  continueButton.container.y = currentY;
  
  continueButton.onClick(() => {
    // Execute the trade
    executePlayerTrade(currentPlayer, targetPlayer, tradeOffer);
    resPanel.updateResources(state.players);
    
    // Close dialog and re-enable HUD
    dialog.close();
    setTimeout(() => {
      enableHUD(hud);
    }, 100);
  });

  dialog.content.addChild(continueButton.container);

  disableHUD(hud);
  dialog.show();
}

/**
 * Show trade rejected dialog
 * @param {object} params - Parameters
 */
function showTradeRejectedDialog({ app, hud, state, resPanel, currentPlayer, targetPlayer, tradeOffer, aiDecision, graph }) {
  const dialog = createDialog(app, {
    title: "Trade Rejected 😞",
    subtitle: `Player ${targetPlayer.id} declined your trade`,
    type: DIALOG_TYPES.MEDIUM,
    onClose: () => enableHUD(hud)
  });

  let currentY = dialog.contentStartY + SPACING.md;

  // Rejection message
  const rejectionText = createStyledText(
    `Player ${targetPlayer.id} says: "${aiDecision.reason}"\n\nMaybe try a different offer?`,
    'body'
  );
  rejectionText.x = SPACING.md;
  rejectionText.y = currentY;
  rejectionText.style.fill = COLORS.text.error;
  dialog.content.addChild(rejectionText);

  currentY += 100;

  // Action buttons
  const buttonContainer = new PIXI.Container();
  buttonContainer.x = SPACING.md;
  buttonContainer.y = currentY;
  dialog.content.addChild(buttonContainer);

  const tryAgainButton = makeButton("Try Different Trade", 180, 'primary');
  const cancelButton = makeButton("Cancel", 100, 'secondary');

  tryAgainButton.onClick(() => {
    dialog.close();
    setTimeout(() => {
      showTradeNegotiationDialog({ app, hud, state, resPanel, targetPlayer, graph });
    }, 100);
  });

  cancelButton.onClick(() => {
    dialog.close();
    setTimeout(() => {
      enableHUD(hud);
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
 * @param {object} giver - Player giving resources
 * @param {object} receiver - Player receiving resources  
 * @param {object} tradeOffer - Trade offer {give, receive}
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

/**
 * Create a player selection button for trading
 * @param {object} player - Player object
 * @param {function} onClick - Click handler
 * @returns {PIXI.Container} Player button container
 */
function createPlayerTradeButton(player, onClick) {
  const container = new PIXI.Container();
  
  // Background
  const bg = new PIXI.Graphics();
  bg.beginFill(COLORS.background.secondary, 0.8);
  bg.drawRoundedRect(0, 0, 300, 60, 8);
  bg.endFill();
  bg.lineStyle(2, COLORS.ui.border);
  bg.drawRoundedRect(0, 0, 300, 60, 8);
  container.addChild(bg);
  
  // Player color indicator
  const colorDot = new PIXI.Graphics();
  const playerColor = [0xd32f2f, 0x1976d2, 0xffa000, 0x388e3c][player.colorIdx];
  colorDot.beginFill(playerColor);
  colorDot.drawCircle(0, 0, 8);
  colorDot.endFill();
  colorDot.x = 20;
  colorDot.y = 30;
  container.addChild(colorDot);
  
  // Player name
  const nameText = createStyledText(`Player ${player.id}`, 'subtitle');
  nameText.x = 40;
  nameText.y = 15;
  container.addChild(nameText);
  
  // Resource count
  const totalResources = Object.values(player.resources).reduce((sum, count) => sum + count, 0);
  const resourceText = createStyledText(`${totalResources} resources`, 'body');
  resourceText.x = 40;
  resourceText.y = 35;
  container.addChild(resourceText);
  
  // Make interactive
  container.eventMode = "static";
  container.cursor = "pointer";
  
  container.on("pointerover", () => {
    bg.clear();
    bg.beginFill(COLORS.ui.hover, 0.9);
    bg.drawRoundedRect(0, 0, 300, 60, 8);
    bg.endFill();
    bg.lineStyle(2, COLORS.ui.accent);
    bg.drawRoundedRect(0, 0, 300, 60, 8);
  });
  
  container.on("pointerout", () => {
    bg.clear();
    bg.beginFill(COLORS.background.secondary, 0.8);
    bg.drawRoundedRect(0, 0, 300, 60, 8);
    bg.endFill();
    bg.lineStyle(2, COLORS.ui.border);
    bg.drawRoundedRect(0, 0, 300, 60, 8);
  });
  
  container.on("pointertap", onClick);
  
  return container;
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
 * Show trade success message
 * @param {object} app - PIXI app
 * @param {string} message - Success message
 */
function showTradeSuccessMessage(app, message) {
  console.log("Trade success:", message);
  // Could be enhanced with a proper notification dialog
}
