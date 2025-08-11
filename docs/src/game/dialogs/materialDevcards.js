// docs/src/game/dialogs/materialDevcards.js
// 🎨 Material Design Development Card Dialog System
// Modern dev card dialogs using Material Design components

import { 
  createMaterialDialog,
  createMaterialChoice,
  createMaterialConfirm,
  createMaterialAlert,
  MATERIAL_DIALOG_TYPES 
} from '../../utils/materialDialog.js';

import { 
  createMaterialButton
} from '../../catan/ui/materialButton.js';

import {
  createMaterialText,
  createMaterialContainer,
  drawMaterialCard,
  drawMaterialChip,
  getMaterialResourceColor,
  animateScale
} from '../../utils/materialUI.js';

import { 
  MATERIAL_COLORS, 
  MATERIAL_SPACING,
  MATERIAL_MOTION
} from '../../config/materialDesign.js';

import { RES_KEYS } from '../../config/constants.js';

// Game functionality
import { startBuildRoad } from '../buildRoad.js';

// Development card effects
import { playKnight } from "../devcards/effects/knight.js";
import { playRoadBuilding } from "../devcards/effects/roadBuilding.js";
import { playYearOfPlenty } from "../devcards/effects/yearOfPlenty.js";
import { playMonopoly } from "../devcards/effects/monopoly.js";

// ==================== BUY DEV CARD DIALOG ====================

/**
 * Show Material Design buy development card dialog
 * @param {object} deps - Dependencies
 */
export function showMaterialBuyDevCardDialog({ app, hud, state, resPanel, refreshScores }) {
  if (state.phase !== "play") {
    const alert = createMaterialAlert(app, {
      title: "Invalid Action",
      message: "You can only buy a development card on your turn.",
    });
    alert.show();
    return;
  }

  const me = state.players[state.currentPlayer - 1];
  const cost = { ore: 1, wheat: 1, sheep: 1 };
  
  if (!canAfford(me.resources, cost)) {
    const alert = createMaterialAlert(app, {
      title: "Insufficient Resources",
      message: "You need 1 ore, 1 wheat, and 1 sheep to buy a development card.",
    });
    alert.show();
    return;
  }

  if (!state.devDeck || state.devDeck.length === 0) {
    const alert = createMaterialAlert(app, {
      title: "No Cards Available",
      message: "The development card deck is empty.",
    });
    alert.show();
    return;
  }

  // Create custom dialog with resource cost display
  const dialog = createMaterialDialog(app, {
    type: MATERIAL_DIALOG_TYPES.MEDIUM,
    title: "Buy Development Card",
    animation: 'scale'
  });

  // Create main content container
  const mainContainer = new PIXI.Container();
  dialog.addContent(mainContainer);

  let currentY = 0;

  // Description
  const description = createMaterialText(
    "Purchase a random development card for:",
    'bodyLarge',
    { fill: MATERIAL_COLORS.neutral[300] }
  );
  description.anchor.set(0.5, 0);
  description.x = 160; // Center in 500px dialog width
  description.y = currentY;
  mainContainer.addChild(description);
  currentY += 40;

  // Cost display with colored resource boxes
  const costContainer = createCostDisplay(cost);
  costContainer.x = 60;
  costContainer.y = currentY;
  mainContainer.addChild(costContainer);

  // Add buttons
  dialog.addButton('Cancel', {
    variant: 'text'
  });

  dialog.addButton('Buy Card', {
    variant: 'filled',
    onClick: () => {
      const cardType = executeBuyDevCard({ state, resPanel, refreshScores, hud });
      dialog.close();
      showCardPurchaseResult(app, cardType);
    }
  });

  dialog.show();
}

/**
 * Show the result of purchasing a development card
 */
function showCardPurchaseResult(app, cardType) {
  const cardName = getCardDisplayName(cardType);
  const cardDesc = getCardDescription(cardType);
  
  const alert = createMaterialAlert(app, {
    title: "🎉 Card Purchased!",
    message: `You received a ${cardName} card!\n\n${cardDesc}`,
    buttonText: "Great!",
    animation: 'scale'
  });
  
  alert.show();
}

// ==================== PLAY DEV CARD DIALOG ====================

/**
 * Show Material Design play development card dialog
 * @param {object} deps - Dependencies
 */
export function showMaterialPlayDevCardDialog({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder, refreshScores, refreshHudAvailability }) {
  const me = state.players[state.currentPlayer - 1];
  const playableCards = getPlayableCards(me);

  if (playableCards.length === 0) {
    const alert = createMaterialAlert(app, {
      title: "No Playable Cards",
      message: "You don't have any development cards that can be played this turn.",
    });
    alert.show();
    return;
  }

  // Create choice dialog
  const dialog = createMaterialChoice(app, {
    title: "Play Development Card",
    message: "Choose a development card to play:",
    choices: [],
    animation: 'scale',
    elevation: 3
  });

  // Create custom content for dev cards
  const contentContainer = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[4],
    direction: 'vertical'
  });
  dialog.addContent(contentContainer);

  // Add available cards
  playableCards.forEach(card => {
    const cardComponent = createDevCardComponent(card, () => {
      dialog.close();
      playDevCard(card, { app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder, refreshScores });
    });
    contentContainer.materialLayout.addChild(cardComponent);
  });

  // Add cancel button
  dialog.addButton('Cancel', {
    variant: 'text'
  });

  dialog.show();
}

// ==================== HELPER COMPONENTS ====================

/**
 * Create a cost display component
 */
function createCostDisplay(cost) {
  const container = new PIXI.Container();

  // Position cost chips horizontally
  const chips = [];
  Object.entries(cost).forEach(([resource, amount]) => {
    const costChip = createCostChip(resource, amount);
    chips.push(costChip);
  });

  // Arrange chips horizontally with better spacing
  const chipWidth = 70;
  const chipGap = 25;
  const totalWidth = chips.length * chipWidth + (chips.length - 1) * chipGap;
  
  chips.forEach((chip, index) => {
    chip.x = index * (chipWidth + chipGap);
    chip.y = 0;
    container.addChild(chip);
  });

  // Store total width for centering
  container.width = totalWidth;

  return container;
}

/**
 * Create a cost chip component (similar to resource selection chips)
 */
function createCostChip(resource, amount) {
  const container = new PIXI.Container();
  
  // Background chip with resource color
  const bg = new PIXI.Graphics();
  const color = getMaterialResourceColor(resource);
  bg.beginFill(color);
  bg.drawRoundedRect(0, 0, 70, 60, 12);
  bg.endFill();
  container.addChild(bg);

  // Resource name
  const nameText = createMaterialText(resource.charAt(0).toUpperCase() + resource.slice(1), 'label', {
    fill: MATERIAL_COLORS.neutral[0],
    fontSize: 14
  });
  nameText.anchor.set(0.5);
  nameText.x = 35;
  nameText.y = 18;
  container.addChild(nameText);

  // Amount
  const amountText = createMaterialText(amount.toString(), 'counter', {
    fill: MATERIAL_COLORS.neutral[0],
    fontSize: 20,
    fontWeight: 'bold'
  });
  amountText.anchor.set(0.5);
  amountText.x = 35;
  amountText.y = 38;
  container.addChild(amountText);

  return container;
}

/**
 * Create a resource display component
 */
function createResourceDisplay(resources) {
  const container = new PIXI.Container();

  // Background with proper sizing for custom dialog
  const bg = new PIXI.Graphics();
  drawMaterialCard(bg, 550, 60, { // Fixed width for 600px dialog
    elevation: 1,
    backgroundColor: MATERIAL_COLORS.surface.secondary,
    borderRadius: 12
  });
  container.addChild(bg);

  // Position resource chips horizontally
  const chips = [];
  RES_KEYS.forEach(resource => {
    const amount = resources[resource] || 0;
    const resourceChip = createResourceChip(resource, amount);
    chips.push(resourceChip);
  });

  // Center the chips horizontally
  const totalChipWidth = chips.length * 60 + (chips.length - 1) * 15; // chip width + gaps
  const startX = (550 - totalChipWidth) / 2;
  
  chips.forEach((chip, index) => {
    chip.x = startX + index * 75; // 60 width + 15 gap
    chip.y = 10; // Centered vertically in 60px height
    container.addChild(chip);
  });

  return container;
}

/**
 * Create a resource chip component
 */
function createResourceChip(resource, amount) {
  const container = new PIXI.Container();
  
  // Background chip
  const bg = new PIXI.Graphics();
  const color = getMaterialResourceColor(resource);
  bg.beginFill(color, 0.8);
  bg.drawRoundedRect(0, 0, 60, 40, 8);
  bg.endFill();
  container.addChild(bg);

  // Resource initial
  const nameText = createMaterialText(resource.charAt(0).toUpperCase(), 'label', {
    fill: MATERIAL_COLORS.neutral[0],
    fontSize: 12
  });
  nameText.x = 8;
  nameText.y = 5;
  container.addChild(nameText);

  // Amount
  const amountText = createMaterialText(amount.toString(), 'counter', {
    fill: MATERIAL_COLORS.neutral[0],
    fontSize: 14
  });
  amountText.x = 8;
  amountText.y = 20;
  container.addChild(amountText);

  return container;
}

/**
 * Create a development card component
 */
function createDevCardComponent(card, onPlay) {
  const container = new PIXI.Container();
  
  // Background
  const bg = new PIXI.Graphics();
  drawMaterialCard(bg, 450, 80, {
    elevation: 2,
    backgroundColor: MATERIAL_COLORS.surface.secondary,
    borderRadius: 12
  });
  container.addChild(bg);

  // Card info
  const cardContainer = createMaterialContainer({
    padding: MATERIAL_SPACING[4],
    gap: MATERIAL_SPACING[3],
    direction: 'horizontal'
  });
  container.addChild(cardContainer);

  // Card details
  const detailsContainer = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[1],
    direction: 'vertical'
  });

  // Card name
  const cardName = createMaterialText(getCardDisplayName(card.type), 'sectionHeader');
  detailsContainer.materialLayout.addChild(cardName);

  // Card description
  const cardDesc = createMaterialText(getCardDescription(card.type), 'bodyMedium', {
    fill: MATERIAL_COLORS.neutral[400]
  });
  detailsContainer.materialLayout.addChild(cardDesc);

  cardContainer.materialLayout.addChild(detailsContainer);

  // Play button
  const playButton = createMaterialButton('Play', {
    variant: 'filled',
    size: 'medium',
  });
  playButton.container.x = 350;
  playButton.container.y = 20;
  playButton.onClick(onPlay);
  container.addChild(playButton.container);

  // Hover effect
  bg.eventMode = 'static';
  bg.on('pointerover', () => {
    animateScale(container, 1.02, MATERIAL_MOTION.duration.fast);
  });
  bg.on('pointerout', () => {
    animateScale(container, 1, MATERIAL_MOTION.duration.fast);
  });

  return container;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get playable development cards for a player
 */
function getPlayableCards(player) {
  const cards = [];
  const dev = player.dev || {};
  const devNew = player.devNew || {};

  // Knight cards
  const playableKnights = Math.max(0, (dev.knight || 0) - (devNew.knight || 0));
  for (let i = 0; i < playableKnights; i++) {
    cards.push({ type: 'knight' });
  }

  // Road building cards
  const playableRoadBuilding = Math.max(0, (dev.road_building || 0) - (devNew.road_building || 0));
  for (let i = 0; i < playableRoadBuilding; i++) {
    cards.push({ type: 'road_building' });
  }

  // Year of plenty cards
  const playableYearOfPlenty = Math.max(0, (dev.year_of_plenty || 0) - (devNew.year_of_plenty || 0));
  for (let i = 0; i < playableYearOfPlenty; i++) {
    cards.push({ type: 'year_of_plenty' });
  }

  // Monopoly cards
  const playableMonopoly = Math.max(0, (dev.monopoly || 0) - (devNew.monopoly || 0));
  for (let i = 0; i < playableMonopoly; i++) {
    cards.push({ type: 'monopoly' });
  }

  return cards;
}

/**
 * Get display name for card type
 */
function getCardDisplayName(type) {
  const names = {
    knight: 'Knight',
    road_building: 'Road Building',
    year_of_plenty: 'Year of Plenty',
    monopoly: 'Monopoly'
  };
  return names[type] || type;
}

/**
 * Get description for card type
 */
function getCardDescription(type) {
  const descriptions = {
    knight: 'Move the robber and steal a resource',
    road_building: 'Build 2 roads for free',
    year_of_plenty: 'Take 2 resources from the bank',
    monopoly: 'All players give you their cards of one type'
  };
  return descriptions[type] || '';
}

/**
 * Check if player can afford a cost
 */
function canAfford(resources, cost) {
  return Object.entries(cost).every(([resource, amount]) => 
    (resources[resource] || 0) >= amount
  );
}

/**
 * Execute buying a development card
 */
function executeBuyDevCard({ state, resPanel, refreshScores, hud }) {
  const me = state.players[state.currentPlayer - 1];
  const cost = { ore: 1, wheat: 1, sheep: 1 };

  // Deduct resources
  Object.entries(cost).forEach(([resource, amount]) => {
    me.resources[resource] -= amount;
  });

  // Draw card from deck
  const cardType = state.devDeck.pop();
  me.dev = me.dev || {};
  me.devNew = me.devNew || {};
  me.dev[cardType] = (me.dev[cardType] || 0) + 1;
  me.devNew[cardType] = (me.devNew[cardType] || 0) + 1;

  // Update UI
  resPanel.updateResources(state.players);
  refreshScores();
  hud.showResult(`Bought ${getCardDisplayName(cardType)} development card!`);
  
  return cardType; // Return the card type for feedback
}

/**
 * Play a development card
 */
function playDevCard(card, deps) {
  const { app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder, refreshScores, refreshHudAvailability } = deps;

  switch (card.type) {
    case 'knight':
      playKnight({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, refreshScores, refreshHudAvailability });
      break;
    case 'road_building':
      playRoadBuilding({ app, hud, state, resPanel, boardC, graph, builder, startBuildRoad, refreshScores, refreshHudAvailability });
      break;
    case 'year_of_plenty':
      playYearOfPlenty({ app, hud, state, resPanel, refreshScores });
      break;
    case 'monopoly':
      playMonopoly({ app, hud, state, resPanel, refreshScores });
      break;
    default:
      console.warn('Unknown card type:', card.type);
  }
}
