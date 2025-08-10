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

  // Create confirmation dialog using predefined LARGE type
  const dialog = createMaterialDialog(app, {
    type: MATERIAL_DIALOG_TYPES.LARGE, // Use existing large type (700x500)
    title: "Buy Development Card",
    animation: 'scale'
  });

  // Create main content container with proper layout for 700px width dialog
  const mainContainer = new PIXI.Container();
  dialog.addContent(mainContainer);

  let currentY = 30; // Start position with more top padding

  // Description
  const description = createMaterialText(
    "Purchase a random development card for the following cost:",
    'bodyLarge',
    { fill: MATERIAL_COLORS.neutral[300] }
  );
  description.x = 50; // More left padding for 700px width
  description.y = currentY;
  mainContainer.addChild(description);
  currentY += 50;

  // Cost display
  const costContainer = createCostDisplay(cost);
  costContainer.x = (700 - 500) / 2; // Center in 700px width
  costContainer.y = currentY;
  mainContainer.addChild(costContainer);
  currentY += 120;

  // Resources label
  const resourcesLabel = createMaterialText('Your Resources:', 'label', {
    fill: MATERIAL_COLORS.primary[200],
    fontSize: 16
  });
  resourcesLabel.x = 50; // Match description padding
  resourcesLabel.y = currentY;
  mainContainer.addChild(resourcesLabel);
  currentY += 40;

  // Resources display
  const resourcesContainer = createResourceDisplay(me.resources);
  resourcesContainer.x = (700 - 550) / 2; // Center in 700px width
  resourcesContainer.y = currentY;
  mainContainer.addChild(resourcesContainer);

  // Add buttons
  dialog.addButton('Cancel', {
    variant: 'text'
  });

  const canAffordCard = canAfford(me.resources, cost);
  dialog.addButton('Buy Card', {
    variant: 'filled',
    disabled: !canAffordCard,
    onClick: () => {
      const cardType = executeBuyDevCard({ state, resPanel, refreshScores, hud });
      dialog.close();
      
      // Show success dialog with the card you got
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
export function showMaterialPlayDevCardDialog({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder, refreshScores }) {
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

  // Background with proper size for custom dialog
  const bg = new PIXI.Graphics();
  drawMaterialCard(bg, 500, 80, { // Fixed width for 600px dialog
    elevation: 2,
    backgroundColor: MATERIAL_COLORS.surface.primary,
    borderRadius: 16
  });
  container.addChild(bg);

  // Position cost chips horizontally centered
  const chips = [];
  Object.entries(cost).forEach(([resource, amount]) => {
    const costChip = createCostChip(resource, amount);
    chips.push(costChip);
  });

  // Center the chips horizontally
  const totalChipWidth = chips.length * 60 + (chips.length - 1) * 20; // chip width + gaps
  const startX = (500 - totalChipWidth) / 2;
  
  chips.forEach((chip, index) => {
    chip.x = startX + index * 80; // 60 width + 20 gap
    chip.y = 20; // Centered vertically in 80px height
    container.addChild(chip);
  });

  return container;
}

/**
 * Create a cost chip component
 */
function createCostChip(resource, amount) {
  const container = new PIXI.Container();
  
  // Background chip
  const bg = new PIXI.Graphics();
  drawMaterialChip(bg, 80, 50, {
    backgroundColor: getMaterialResourceColor(resource),
    variant: 'filled'
  });
  container.addChild(bg);

  // Resource icon (simplified)
  const nameText = createMaterialText(resource.charAt(0).toUpperCase(), 'label', {
    fill: MATERIAL_COLORS.neutral[0],
    fontSize: 16
  });
  nameText.anchor.set(0.5);
  nameText.x = 25;
  nameText.y = 15;
  container.addChild(nameText);

  // Amount
  const amountText = createMaterialText(amount.toString(), 'counter', {
    fill: MATERIAL_COLORS.neutral[0],
    fontSize: 18
  });
  amountText.anchor.set(0.5);
  amountText.x = 55;
  amountText.y = 25;
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
  const { app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder, refreshScores } = deps;

  switch (card.type) {
    case 'knight':
      playKnight({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, refreshScores });
      break;
    case 'road_building':
      playRoadBuilding({ app, hud, state, resPanel, boardC, graph, builder, refreshScores });
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
