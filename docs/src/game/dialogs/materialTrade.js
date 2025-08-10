// docs/src/game/dialogs/materialTrade.js
// 🎨 Material Design Trade Dialog System
// Modern trade dialogs using Material Design components

import { 
  createMaterialDialog,
  createMaterialChoice,
  createMaterialConfirm,
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
  getMaterialResourceColor
} from '../../utils/materialUI.js';

import { 
  MATERIAL_COLORS, 
  MATERIAL_SPACING,
  MATERIAL_MOTION
} from '../../config/materialDesign.js';

import { RES_KEYS } from '../../config/constants.js';

// ==================== MAIN TRADE MENU ====================

/**
 * Show Material Design trade menu
 * @param {object} deps - Dependencies (app, hud, state, resPanel, graph)
 */
export function showMaterialTradeMenu({ app, hud, state, resPanel, graph }) {
  // Temporary simple test - just show bank trade directly
  console.log("🛍️ Trade menu - showing bank trade dialog directly for testing");
  showMaterialBankTradeDialog({ app, hud, state, resPanel, graph });
  
  // Original choice dialog (commented out for testing)
  /*
  const dialog = createMaterialChoice(app, {
    title: "Trade",
    message: "Choose your trading partner",
    choices: [
      { label: "Trade with Bank", value: "bank" },
      { label: "Trade with Player", value: "player" }
    ],
    onChoice: (choice) => {
      if (choice === "bank") {
        showMaterialBankTradeDialog({ app, hud, state, resPanel, graph });
      } else {
        showMaterialPlayerTradeDialog({ app, hud, state, resPanel, graph });
      }
    },
    onCancel: () => {
      enableHUD(hud);
    }
  });

  disableHUD(hud);
  dialog.show();
  */
}

// ==================== BANK TRADE DIALOG ====================

/**
 * Show Material Design bank trade dialog
 * @param {object} deps - Dependencies
 */
export function showMaterialBankTradeDialog({ app, hud, state, resPanel, graph }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  const rates = computeEffectiveRatesForCurrentPlayer(state, graph);
  
  const dialog = createMaterialDialog(app, {
    type: MATERIAL_DIALOG_TYPES.LARGE,
    title: "Bank Trade",
    animation: 'scale',
    elevation: 4
  });

  // Create trade interface
  const tradeContainer = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[5],
    direction: 'vertical'
  });
  dialog.addContent(tradeContainer);

  // Current resources display
  const resourcesHeader = createMaterialText('Your Resources', 'sectionHeader');
  tradeContainer.materialLayout.addChild(resourcesHeader);

  const resourcesContainer = createResourceDisplay(currentPlayer.resources);
  tradeContainer.materialLayout.addChild(resourcesContainer);

  // Available trades
  const tradesHeader = createMaterialText('Available Trades', 'sectionHeader');
  tradeContainer.materialLayout.addChild(tradesHeader);

  const tradesContainer = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[3],
    direction: 'vertical'
  });
  tradeContainer.materialLayout.addChild(tradesContainer);

  // Create trade options
  RES_KEYS.forEach(giveResource => {
    const rate = rates[giveResource];
    const available = currentPlayer.resources[giveResource] || 0;
    
    if (available >= rate) {
      RES_KEYS.forEach(getResource => {
        if (giveResource !== getResource) {
          const tradeOption = createTradeOption(
            giveResource, 
            rate, 
            getResource, 
            1,
            () => executeBankTrade(giveResource, rate, getResource, 1, { app, hud, state, resPanel, dialog })
          );
          tradesContainer.materialLayout.addChild(tradeOption);
        }
      });
    }
  });

  // Add close button
  dialog.addButton('Close', {
    variant: 'text',
    onClick: () => enableHUD(hud)
  });

  dialog.show();
}

// ==================== PLAYER TRADE DIALOG ====================

/**
 * Show Material Design player trade dialog
 * @param {object} deps - Dependencies
 */
export function showMaterialPlayerTradeDialog({ app, hud, state, resPanel, graph }) {
  const dialog = createMaterialDialog(app, {
    type: MATERIAL_DIALOG_TYPES.LARGE,
    title: "Player Trade",
    animation: 'scale',
    elevation: 4
  });

  // Trade builder interface
  const tradeBuilder = createPlayerTradeBuilder(state, (tradeOffer) => {
    // Send trade offer to other players
    showTradeOfferDialog(app, tradeOffer, state, dialog);
  });

  dialog.addContent(tradeBuilder);

  // Add buttons
  dialog.addButton('Cancel', {
    variant: 'text',
    onClick: () => enableHUD(hud)
  });

  dialog.show();
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a resource display component
 */
function createResourceDisplay(resources) {
  const container = createMaterialContainer({
    padding: MATERIAL_SPACING[4],
    gap: MATERIAL_SPACING[3],
    direction: 'horizontal'
  });

  // Background
  const bg = new PIXI.Graphics();
  drawMaterialCard(bg, 450, 80, {
    elevation: 1,
    backgroundColor: MATERIAL_COLORS.surface.tertiary,
    borderRadius: 12
  });
  container.addChildAt(bg, 0);

  RES_KEYS.forEach(resource => {
    const amount = resources[resource] || 0;
    const resourceChip = createResourceChip(resource, amount);
    container.materialLayout.addChild(resourceChip);
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
  drawMaterialChip(bg, 80, 40, {
    backgroundColor: getMaterialResourceColor(resource),
    variant: 'filled'
  });
  container.addChild(bg);

  // Resource name
  const nameText = createMaterialText(resource.charAt(0).toUpperCase() + resource.slice(1), 'label', {
    fill: MATERIAL_COLORS.neutral[0]
  });
  nameText.x = 8;
  nameText.y = 8;
  container.addChild(nameText);

  // Amount
  const amountText = createMaterialText(amount.toString(), 'counter', {
    fill: MATERIAL_COLORS.neutral[0],
    fontSize: 16
  });
  amountText.x = 8;
  amountText.y = 22;
  container.addChild(amountText);

  return container;
}

/**
 * Create a trade option component
 */
function createTradeOption(giveResource, giveAmount, getResource, getAmount, onTrade) {
  const container = new PIXI.Container();
  
  // Background
  const bg = new PIXI.Graphics();
  drawMaterialCard(bg, 400, 60, {
    elevation: 1,
    backgroundColor: MATERIAL_COLORS.surface.accent,
    borderRadius: 8
  });
  container.addChild(bg);

  // Trade description
  const tradeText = createMaterialText(
    `Give ${giveAmount} ${giveResource} → Get ${getAmount} ${getResource}`, 
    'bodyMedium'
  );
  tradeText.x = MATERIAL_SPACING[4];
  tradeText.y = 20;
  container.addChild(tradeText);

  // Trade button
  const tradeButton = createMaterialButton('Trade', {
    variant: 'filled',
    size: 'small',
  });
  tradeButton.container.x = 320;
  tradeButton.container.y = 15;
  tradeButton.onClick(onTrade);
  container.addChild(tradeButton.container);

  // Hover effect
  bg.eventMode = 'static';
  bg.on('pointerover', () => {
    bg.alpha = 0.8;
  });
  bg.on('pointerout', () => {
    bg.alpha = 1;
  });

  return container;
}

/**
 * Create player trade builder interface
 */
function createPlayerTradeBuilder(state, onCreateOffer) {
  const container = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[4],
    direction: 'vertical'
  });

  // Instructions
  const instructions = createMaterialText(
    'Build your trade offer by selecting resources to give and receive',
    'bodyMedium',
    { fill: MATERIAL_COLORS.neutral[400] }
  );
  container.materialLayout.addChild(instructions);

  // Trade offer state
  const tradeOffer = {
    give: {},
    get: {}
  };

  // Give section
  const giveSection = createTradeSection('Resources to Give', tradeOffer.give);
  container.materialLayout.addChild(giveSection);

  // Get section
  const getSection = createTradeSection('Resources to Receive', tradeOffer.get);
  container.materialLayout.addChild(getSection);

  // Create offer button
  const createOfferButton = createMaterialButton('Create Trade Offer', {
    variant: 'filled',
    size: 'large',
    width: 300
  });
  createOfferButton.onClick(() => {
    onCreateOffer(tradeOffer);
  });
  container.materialLayout.addChild(createOfferButton.container);

  return container.container;
}

/**
 * Create a trade section (give or get)
 */
function createTradeSection(title, tradeData) {
  const container = createMaterialContainer({
    padding: MATERIAL_SPACING[4],
    gap: MATERIAL_SPACING[3],
    direction: 'vertical'
  });

  // Background
  const bg = new PIXI.Graphics();
  drawMaterialCard(bg, 500, 120, {
    elevation: 1,
    backgroundColor: MATERIAL_COLORS.surface.tertiary,
    borderRadius: 12
  });
  container.addChildAt(bg, 0);

  // Title
  const titleText = createMaterialText(title, 'sectionHeader');
  container.materialLayout.addChild(titleText);

  // Resource selectors
  const resourceContainer = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[2],
    direction: 'horizontal'
  });
  container.materialLayout.addChild(resourceContainer);

  RES_KEYS.forEach(resource => {
    const selector = createResourceSelector(resource, tradeData);
    resourceContainer.materialLayout.addChild(selector);
  });

  return container;
}

/**
 * Create a resource selector with +/- buttons
 */
function createResourceSelector(resource, tradeData) {
  const container = new PIXI.Container();
  
  // Background
  const bg = new PIXI.Graphics();
  drawMaterialChip(bg, 80, 60, {
    backgroundColor: getMaterialResourceColor(resource),
    variant: 'outlined'
  });
  container.addChild(bg);

  // Resource name
  const nameText = createMaterialText(resource.charAt(0).toUpperCase(), 'label');
  nameText.anchor.set(0.5);
  nameText.x = 40;
  nameText.y = 15;
  container.addChild(nameText);

  // Amount display
  let amount = tradeData[resource] || 0;
  const amountText = createMaterialText(amount.toString(), 'counter');
  amountText.anchor.set(0.5);
  amountText.x = 40;
  amountText.y = 35;
  container.addChild(amountText);

  // Minus button
  const minusButton = createMaterialButton('-', {
    variant: 'text',
    size: 'small',
    width: 20
  });
  minusButton.container.x = 5;
  minusButton.container.y = 45;
  minusButton.onClick(() => {
    if (amount > 0) {
      amount--;
      tradeData[resource] = amount;
      amountText.text = amount.toString();
    }
  });
  container.addChild(minusButton.container);

  // Plus button
  const plusButton = createMaterialButton('+', {
    variant: 'text',
    size: 'small',
    width: 20
  });
  plusButton.container.x = 55;
  plusButton.container.y = 45;
  plusButton.onClick(() => {
    amount++;
    tradeData[resource] = amount;
    amountText.text = amount.toString();
  });
  container.addChild(plusButton.container);

  return container;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Execute a bank trade
 */
function executeBankTrade(giveResource, giveAmount, getResource, getAmount, { app, hud, state, resPanel, dialog }) {
  const currentPlayer = state.players[state.currentPlayer - 1];
  
  // Validate trade
  if (currentPlayer.resources[giveResource] < giveAmount) {
    hud.showResult("Not enough resources!");
    return;
  }

  // Execute trade
  currentPlayer.resources[giveResource] -= giveAmount;
  currentPlayer.resources[getResource] = (currentPlayer.resources[getResource] || 0) + getAmount;

  // Update UI
  resPanel.updateResources(state.players);
  hud.showResult(`Traded ${giveAmount} ${giveResource} for ${getAmount} ${getResource}!`);
  
  // Close dialog
  dialog.close();
  enableHUD(hud);
}

/**
 * Compute effective trading rates for current player
 */
function computeEffectiveRatesForCurrentPlayer(state, graph) {
  // Simplified - in real game this would check for harbors
  return {
    brick: 4,
    wood: 4,
    wheat: 4,
    sheep: 4,
    ore: 4
  };
}

/**
 * Disable HUD during dialog
 */
function disableHUD(hud) {
  // Simplified - in real implementation would disable all buttons
  console.log('HUD disabled');
}

/**
 * Enable HUD after dialog
 */
function enableHUD(hud) {
  // Simplified - in real implementation would re-enable buttons
  console.log('HUD enabled');
}
