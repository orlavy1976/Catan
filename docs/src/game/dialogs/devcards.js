// docs/src/game/dialogs/devcards.js
// 🃏 Development Card Dialog System
// Modern, design-system-based development card dialogs

import { 
  createDialog, 
  createChoiceDialog, 
  createResourceDialog,
  createConfirmDialog,
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
  createBodyText,
  stackVertically,
  arrangeHorizontally 
} from "../../utils/ui.js";
import { makeButton } from "../../catan/ui/button.js";
import { drawDevCardFace, pretty, prettyDesc } from "../devcards/ui.js";

// Development card effects
import { playKnight } from "../devcards/effects/knight.js";
import { playRoadBuilding } from "../devcards/effects/roadBuilding.js";
import { playYearOfPlenty } from "../devcards/effects/yearOfPlenty.js";
import { playMonopoly } from "../devcards/effects/monopoly.js";

// ==================== CARD PURCHASE DIALOG ====================

/**
 * Show development card purchase confirmation
 * @param {object} deps - Dependencies
 */
export function showBuyDevCardDialog({ app, hud, state, resPanel }) {
  if (state.phase !== "play") {
    hud.showResult("You can only buy a development card on your turn.");
    return;
  }

  const me = state.players[state.currentPlayer - 1];
  const cost = { ore: 1, wheat: 1, sheep: 1 };
  
  if (!canAfford(me.resources, cost)) {
    hud.showResult("Need 1 ore, 1 wheat, 1 sheep.");
    return;
  }
  
  if (!state.devDeck?.length) {
    hud.showResult("Development deck is empty.");
    return;
  }

  const dialog = createConfirmDialog(app, {
    title: "Buy Development Card",
    message: "Purchase a development card for 1 ore, 1 wheat, 1 sheep?",
    yesText: "Buy Card",
    noText: "Cancel",
    animation: DIALOG_ANIMATION.SCALE,
    onYes: () => {
      executePurchase();
    },
    onNo: () => {
      enableHUD(hud);
    }
  });

  disableHUD(hud);
  dialog.show();

  function executePurchase() {
    // Pay cost
    Object.keys(cost).forEach(resource => {
      me.resources[resource] -= cost[resource];
    });

    // Draw card
    const card = state.devDeck.pop();
    me.dev[card] = (me.dev[card] || 0) + 1;
    me.devNew[card] = (me.devNew[card] || 0) + 1;

    // Update UI
    resPanel?.updateResources?.(state.players);
    
    // Show card reveal
    showCardRevealDialog({ app, hud, card });
  }
}

// ==================== CARD REVEAL DIALOG ====================

/**
 * Show the newly purchased development card
 * @param {object} deps - Dependencies
 */
function showCardRevealDialog({ app, hud, card }) {
  const dialog = createDialog(app, {
    title: "Development Card",
    subtitle: "You received a new card!",
    type: DIALOG_TYPES.LARGE,
    animation: DIALOG_ANIMATION.SCALE,
    closeOnOverlay: true,
    showCloseButton: true,
    onClose: () => {
      enableHUD(hud);
      hud.showResult(`You received: ${pretty(card)}`);
    }
  });

  let currentY = dialog.contentStartY;

  // Card visual
  const cardContainer = new PIXI.Container();
  const cardFace = drawDevCardFace(card);
  cardContainer.addChild(cardFace);
  cardContainer.x = (dialog.contentWidth - 100) / 2; // Card is roughly 100px wide
  cardContainer.y = currentY;
  dialog.content.addChild(cardContainer);
  currentY += 120 + SPACING.lg;

  // Card name
  const cardName = createStyledText(pretty(card), 'title', {
    fill: COLORS.text.warning
  });
  cardName.anchor.set(0.5, 0);
  cardName.x = dialog.contentWidth / 2;
  cardName.y = currentY;
  dialog.content.addChild(cardName);
  currentY += cardName.height + SPACING.md;

  // Card description
  const description = createBodyText(prettyDesc(card));
  description.style.wordWrap = true;
  description.style.wordWrapWidth = dialog.contentWidth - 40;
  description.x = 20;
  description.y = currentY;
  dialog.content.addChild(description);
  currentY += description.height + SPACING.lg;

  // OK button
  const okButton = makeButton("OK", 120, 'primary');
  okButton.container.x = (dialog.contentWidth - 120) / 2;
  okButton.container.y = currentY;
  okButton.onClick(() => dialog.close());
  dialog.content.addChild(okButton.container);

  dialog.show();
}

// ==================== PLAY CARD DIALOG ====================

/**
 * Show development card play selection
 * @param {object} deps - Dependencies
 */
export function showPlayDevCardDialog(deps) {
  const { app, hud, state } = deps;
  
  if (state.phase !== "play") {
    hud.showResult("You can only play development cards on your turn.");
    return;
  }

  const me = state.players[state.currentPlayer - 1];
  const playable = getPlayableCards(me);
  const totalPlayable = Object.values(playable).reduce((a, b) => a + b, 0);
  
  if (totalPlayable === 0) {
    hud.showResult("No development cards available to play.");
    return;
  }

  const dialog = createDialog(app, {
    title: "Play Development Card",
    subtitle: "Choose a card to play",
    type: DIALOG_TYPES.LARGE,
    animation: DIALOG_ANIMATION.SCALE,
    onClose: () => enableHUD(hud)
  });

  let currentY = dialog.contentStartY;

  // Card list
  const cardTypes = [
    { key: "knight", name: "Knight", color: 0xff6b6b },
    { key: "road_building", name: "Road Building", color: 0x4ecdc4 },
    { key: "year_of_plenty", name: "Year of Plenty", color: 0xffd93d },
    { key: "monopoly", name: "Monopoly", color: 0x6bcf7f }
  ];

  cardTypes.forEach(cardType => {
    const qty = playable[cardType.key] || 0;
    const available = qty > 0;

    // Card row container
    const rowContainer = new PIXI.Container();
    rowContainer.y = currentY;
    dialog.content.addChild(rowContainer);

    // Card face
    const cardFace = drawDevCardFace(cardType.key);
    cardFace.x = 0;
    cardFace.y = 0;
    if (!available) cardFace.alpha = 0.4;
    rowContainer.addChild(cardFace);

    // Card info
    const infoContainer = new PIXI.Container();
    infoContainer.x = 120;
    rowContainer.addChild(infoContainer);

    // Name and quantity
    const nameText = createStyledText(
      `${cardType.name}${qty > 0 ? ` (×${qty})` : ' (—)'}`,
      'subtitle',
      { fill: available ? cardType.color : COLORS.text.muted }
    );
    nameText.y = 0;
    infoContainer.addChild(nameText);

    // Description
    const descText = createBodyText(prettyDesc(cardType.key));
    descText.style.wordWrap = true;
    descText.style.wordWrapWidth = dialog.contentWidth - 300;
    descText.y = 25;
    if (!available) descText.alpha = 0.6;
    infoContainer.addChild(descText);

    // Play button
    const playButton = makeButton("Play", 100, available ? 'primary' : 'secondary');
    playButton.container.x = dialog.contentWidth - 120;
    playButton.container.y = 15;
    playButton.setEnabled(available);
    
    if (available) {
      playButton.onClick(() => {
        dialog.close();
        playCard(cardType.key, deps);
      });
    }
    
    rowContainer.addChild(playButton.container);

    currentY += 80;
  });

  disableHUD(hud);
  dialog.show();
}

// ==================== MONOPOLY DIALOG ====================

/**
 * Show monopoly resource selection
 * @param {object} deps - Dependencies
 */
export function showMonopolyDialog(deps) {
  const { app, hud, state, resPanel } = deps;
  
  const dialog = createResourceDialog(app, {
    title: "Monopoly",
    subtitle: "Choose a resource to monopolize",
    resources: ['brick', 'wood', 'wheat', 'sheep', 'ore'],
    animation: DIALOG_ANIMATION.SCALE,
    onResourceSelect: (resource) => {
      executeMonopoly(resource, state, resPanel, hud);
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
  const { app, hud, state, resPanel } = deps;
  
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
  const selectedText = createStyledText("Selected: None", 'body');
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
      executeYearOfPlenty(selectedResources, state, resPanel, hud);
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

// ==================== HELPER FUNCTIONS ====================

/**
 * Get playable development cards for a player
 * @param {object} player - Player object
 * @returns {object} Playable card counts
 */
function getPlayableCards(player) {
  const playable = {};
  
  // Only cards not bought this turn can be played
  Object.keys(player.dev || {}).forEach(cardType => {
    const total = player.dev[cardType] || 0;
    const newThisTurn = player.devNew[cardType] || 0;
    playable[cardType] = Math.max(0, total - newThisTurn);
  });

  return playable;
}

/**
 * Check if player can afford a cost
 * @param {object} resources - Player resources
 * @param {object} cost - Cost object
 * @returns {boolean} Can afford
 */
function canAfford(resources, cost) {
  return Object.keys(cost).every(resource => 
    (resources[resource] || 0) >= cost[resource]
  );
}

/**
 * Play a development card
 * @param {string} cardType - Card type to play
 * @param {object} deps - Dependencies
 */
function playCard(cardType, deps) {
  const { hud, state } = deps;
  const me = state.players[state.currentPlayer - 1];
  
  // Remove card from player
  me.dev[cardType] = (me.dev[cardType] || 0) - 1;
  
  // Increment knights played if applicable
  if (cardType === 'knight') {
    me.knightsPlayed = (me.knightsPlayed || 0) + 1;
  }

  // Execute card effect
  switch (cardType) {
    case 'knight':
      playKnight(deps);
      break;
    case 'road_building':
      playRoadBuilding(deps);
      break;
    case 'year_of_plenty':
      showYearOfPlentyDialog(deps);
      return; // Don't enable HUD yet
    case 'monopoly':
      showMonopolyDialog(deps);
      return; // Don't enable HUD yet
    default:
      hud.showResult(`Played ${pretty(cardType)}`);
  }

  enableHUD(hud);
}

/**
 * Execute monopoly effect
 * @param {string} resource - Resource to monopolize
 * @param {object} state - Game state
 * @param {object} resPanel - Resource panel
 * @param {object} hud - HUD
 */
function executeMonopoly(resource, state, resPanel, hud) {
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
  enableHUD(hud);
}

/**
 * Execute year of plenty effect
 * @param {Array} resources - Selected resources
 * @param {object} state - Game state
 * @param {object} resPanel - Resource panel
 * @param {object} hud - HUD
 */
function executeYearOfPlenty(resources, state, resPanel, hud) {
  const me = state.players[state.currentPlayer - 1];
  
  resources.forEach(resource => {
    me.resources[resource] = (me.resources[resource] || 0) + 1;
  });

  resPanel?.updateResources?.(state.players);
  hud.showResult(`Year of Plenty: received ${resources.join(' and ')}`);
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
