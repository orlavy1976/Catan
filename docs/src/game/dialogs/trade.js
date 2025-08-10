// docs/src/game/dialogs/trade.js
// 🤝 Trade Dialog System
// Modern, design-system-based trade dialogs

import { RES_KEYS } from "../../config/constants.js";
import { 
  createDialog, 
  createChoiceDialog, 
  createResourceDialog,
  DIALOG_TYPES,
  DIALOG_ANIMATION 
} from "../../utils/dialog.js";
import { 
  DIMENSIONS, 
  SPACING, 
  COLORS,
  TYPOGRAPHY 
} from "../../config/design.js";
import { 
  createStyledText,
  createSubtitle,
  stackVertically,
  arrangeHorizontally 
} from "../../utils/ui.js";
import { makeButton } from "../../catan/ui/button.js";

// ==================== MAIN TRADE MENU ====================

/**
 * Show the main trade type selection dialog
 * @param {object} deps - Dependencies (app, hud, state, resPanel, graph)
 */
export function showTradeMenu({ app, hud, state, resPanel, graph }) {
  const dialog = createChoiceDialog(app, {
    title: "Choose Trade Type",
    subtitle: "Select how you'd like to trade resources",
    animation: DIALOG_ANIMATION.SCALE,
    choices: [
      { label: "🏪 Bank / Port Trade", value: "bank" },
      { label: "🤝 Player Trade", value: "player" }
    ],
    onChoice: (value) => {
      if (value === "bank") {
        showBankTradeDialog({ app, hud, state, resPanel, graph });
      } else if (value === "player") {
        showPlayerTradeDialog({ app, hud, state, resPanel });
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
 * Show the bank/port trade dialog
 * @param {object} deps - Dependencies
 */
export function showBankTradeDialog({ app, hud, state, resPanel, graph }) {
  const dialog = createDialog(app, {
    title: "Bank / Port Trade",
    subtitle: "Trade with the bank or use your ports",
    type: DIALOG_TYPES.LARGE,
    animation: DIALOG_ANIMATION.SCALE,
    onClose: () => enableHUD(hud)
  });

  // Trade state
  let giveResource = null;
  let getResource = null;
  let multiplier = 4; // Default bank rate

  // Create trade interface
  let currentY = dialog.contentStartY;

  // Current rates display
  const ratesText = createSubtitle("Bank Rate: 4:1 | Your Ports: (calculating...)");
  ratesText.x = 0;
  ratesText.y = currentY;
  dialog.content.addChild(ratesText);
  currentY += ratesText.height + SPACING.lg;

  // Give section
  const giveLabel = createStyledText("Give:", 'subtitle');
  giveLabel.x = 0;
  giveLabel.y = currentY;
  dialog.content.addChild(giveLabel);
  currentY += giveLabel.height + SPACING.md;

  // Give resource buttons
  const giveContainer = new PIXI.Container();
  const giveButtons = createResourceButtons(RES_KEYS, (resource) => {
    giveResource = resource;
    updateTradeStatus();
  });
  
  // Add buttons to container first
  giveButtons.forEach(btn => giveContainer.addChild(btn));
  
  // Then arrange them horizontally
  arrangeHorizontally(
    giveButtons.map(btn => ({ container: btn })),
    0,
    SPACING.md
  );
  
  giveContainer.x = 0;
  giveContainer.y = currentY;
  dialog.content.addChild(giveContainer);
  currentY += 50 + SPACING.lg;

  // Multiplier display
  const multContainer = new PIXI.Container();
  const multLabel = createStyledText("×", 'title');
  const multValue = createStyledText("4", 'title');
  
  multLabel.x = 0;
  multValue.x = 30;
  multContainer.addChild(multLabel);
  multContainer.addChild(multValue);
  
  multContainer.x = (dialog.contentWidth - 60) / 2;
  multContainer.y = currentY;
  dialog.content.addChild(multContainer);
  currentY += multLabel.height + SPACING.lg;

  // Get section
  const getLabel = createStyledText("Get:", 'subtitle');
  getLabel.x = 0;
  getLabel.y = currentY;
  dialog.content.addChild(getLabel);
  currentY += getLabel.height + SPACING.md;

  // Get resource buttons
  const getContainer = new PIXI.Container();
  const getButtons = createResourceButtons(RES_KEYS, (resource) => {
    getResource = resource;
    updateTradeStatus();
  });
  
  // Add buttons to container first
  getButtons.forEach(btn => getContainer.addChild(btn));
  
  // Then arrange them horizontally
  arrangeHorizontally(
    getButtons.map(btn => ({ container: btn })),
    0,
    SPACING.md
  );
  
  getContainer.x = 0;
  getContainer.y = currentY;
  dialog.content.addChild(getContainer);
  currentY += 50 + SPACING.lg;

  // Status text
  const statusText = createStyledText("Select resources to trade", 'body');
  statusText.x = 0;
  statusText.y = currentY;
  dialog.content.addChild(statusText);
  currentY += statusText.height + SPACING.lg;

  // Action buttons
  const buttonContainer = new PIXI.Container();
  const tradeButton = makeButton("Make Trade", 140, 'primary');
  const backButton = makeButton("Back", 120, 'secondary');
  
  // Add buttons to container first
  buttonContainer.addChild(backButton.container);
  buttonContainer.addChild(tradeButton.container);
  
  // Then arrange them horizontally
  arrangeHorizontally([
    { container: backButton.container },
    { container: tradeButton.container }
  ], 0, SPACING.md);
  
  buttonContainer.x = (dialog.contentWidth - 260 - SPACING.md) / 2;
  buttonContainer.y = currentY;
  
  dialog.content.addChild(buttonContainer);

  // Wire events
  tradeButton.onClick(() => {
    if (canMakeTrade()) {
      executeBankTrade();
    }
  });

  backButton.onClick(() => {
    dialog.close();
    showTradeMenu({ app, hud, state, resPanel, graph });
  });

  // Helper functions
  function updateTradeStatus() {
    // Update rates based on current player's ports
    const rates = computeEffectiveRatesForCurrentPlayer(state, graph);
    const currentRate = giveResource ? (rates[giveResource] || 4) : 4;
    multiplier = currentRate;
    
    // Update UI
    multValue.text = String(multiplier);
    
    if (giveResource && getResource) {
      const player = state.players[state.currentPlayer - 1];
      const hasEnough = (player.resources[giveResource] || 0) >= multiplier;
      
      if (hasEnough) {
        statusText.text = `Trade ${multiplier} ${giveResource} for 1 ${getResource}`;
        statusText.style.fill = COLORS.text.success;
        tradeButton.setEnabled(true);
      } else {
        statusText.text = `Need ${multiplier} ${giveResource} (you have ${player.resources[giveResource] || 0})`;
        statusText.style.fill = COLORS.text.error;
        tradeButton.setEnabled(false);
      }
    } else {
      statusText.text = "Select resources to trade";
      statusText.style.fill = COLORS.text.primary;
      tradeButton.setEnabled(false);
    }

    // Update rates display
    const playerRates = Object.entries(rates)
      .map(([res, rate]) => `${res}: ${rate}:1`)
      .join(", ");
    ratesText.text = `Bank Rate: 4:1 | Your Ports: ${playerRates || "None"}`;
  }

  function canMakeTrade() {
    if (!giveResource || !getResource) return false;
    const player = state.players[state.currentPlayer - 1];
    return (player.resources[giveResource] || 0) >= multiplier;
  }

  function executeBankTrade() {
    const player = state.players[state.currentPlayer - 1];
    
    // Remove resources
    player.resources[giveResource] -= multiplier;
    
    // Add resource
    player.resources[getResource] = (player.resources[getResource] || 0) + 1;
    
    // Update UI
    resPanel?.updateResources?.(state.players);
    hud.showResult(`Traded ${multiplier} ${giveResource} for 1 ${getResource}`);
    
    dialog.close();
  }

  // Initial update
  updateTradeStatus();
  dialog.show();
}

// ==================== PLAYER TRADE DIALOG ====================

/**
 * Show the player-to-player trade dialog
 * @param {object} deps - Dependencies
 */
export function showPlayerTradeDialog({ app, hud, state, resPanel }) {
  // This would be a more complex implementation
  // For now, we'll show a placeholder
  const dialog = createDialog(app, {
    title: "Player Trade",
    subtitle: "Player-to-player trading system (Coming Soon)",
    type: DIALOG_TYPES.MEDIUM,
    onClose: () => enableHUD(hud)
  });

  const messageText = createStyledText(
    "Player-to-player trading will be implemented in the next update!",
    'body'
  );
  messageText.x = 0;
  messageText.y = dialog.contentStartY;
  dialog.content.addChild(messageText);

  const backButton = makeButton("Back to Trade Menu", 200, 'primary');
  backButton.container.x = (dialog.contentWidth - 200) / 2;
  backButton.container.y = dialog.contentStartY + 60;
  
  backButton.onClick(() => {
    dialog.close();
    showTradeMenu({ app, hud, state, resPanel });
  });
  
  dialog.content.addChild(backButton.container);
  dialog.show();
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create resource selection buttons
 * @param {Array} resources - Resource types
 * @param {function} onSelect - Selection callback
 * @returns {Array} Button containers
 */
function createResourceButtons(resources, onSelect) {
  return resources.map(resource => {
    const container = new PIXI.Container();
    
    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0xffffff, 0.12);
    bg.drawRoundedRect(0, 0, 80, 40, 8);
    bg.endFill();
    bg.lineStyle({ width: 1, color: 0xffffff, alpha: 0.35 });
    bg.drawRoundedRect(0, 0, 80, 40, 8);
    container.addChild(bg);
    
    // Text
    const text = createStyledText(
      resource.charAt(0).toUpperCase() + resource.slice(1),
      'buttonSmall'
    );
    text.anchor.set(0.5);
    text.x = 40;
    text.y = 20;
    container.addChild(text);
    
    // Interactive
    container.eventMode = "static";
    container.cursor = "pointer";
    container.on("pointertap", () => onSelect(resource));
    
    // Hover effects
    container.on("pointerover", () => {
      bg.alpha = 0.8;
    });
    
    container.on("pointerout", () => {
      bg.alpha = 1;
    });
    
    return container;
  });
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
