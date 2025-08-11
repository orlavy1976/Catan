// docs/src/game/dialogs/materialTrade.js
// 🎨 Material Design Trade Dialog System
// Modern trade dialogs using Material Design components

import { 
  createMaterialDialog,
  createMaterialChoice,
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
  console.log('showMaterialPlayerTradeDialog called - creating player trade interface');
  
  // Disable HUD first
  disableHUD(hud);
  
  const currentPlayer = state.players[state.currentPlayer - 1];
  const otherPlayers = state.players.filter((_, i) => i !== state.currentPlayer - 1);
  
  if (otherPlayers.length === 0) {
    // No other players to trade with
    enableHUD(hud);
    if (hud.showResult) hud.showResult("No other players to trade with");
    return;
  }

  // Create dialog
  const overlay = new PIXI.Container();
  overlay.zIndex = 10000;

  // Background dim
  const dim = new PIXI.Graphics();
  dim.beginFill(0x000000, 0.5);
  dim.drawRect(0, 0, app.renderer.width, app.renderer.height);
  dim.endFill();
  overlay.addChild(dim);

  // Dialog panel
  const panel = new PIXI.Container();
  overlay.addChild(panel);

  // Background
  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.96);
  bg.drawRoundedRect(0, 0, 600, 450, 16);
  bg.endFill();
  bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.18 });
  bg.drawRoundedRect(0, 0, 600, 450, 16);
  panel.addChild(bg);

  // Title
  const title = new PIXI.Text("Player Trade", { 
    fontFamily: "Georgia, serif", 
    fontSize: 22, 
    fill: 0xffffff 
  });
  title.x = 20; 
  title.y = 20;
  panel.addChild(title);

  // Trade state
  let selectedPlayer = 0;
  const giveResources = { brick: 0, wood: 0, wheat: 0, sheep: 0, ore: 0 };
  const getResources = { brick: 0, wood: 0, wheat: 0, sheep: 0, ore: 0 };

  // Player selection
  const playerLabel = new PIXI.Text("Trade with:", { 
    fontFamily: "Arial", 
    fontSize: 16, 
    fill: 0xffffff 
  });
  playerLabel.x = 20; 
  playerLabel.y = 60;
  panel.addChild(playerLabel);

  const playerButtons = [];
  let playerX = 120;
  otherPlayers.forEach((player, index) => {
    const button = createPlayerButton(`Player ${state.players.indexOf(player) + 1}`, () => {
      selectedPlayer = index;
      updatePlayerButtons();
    });
    button.x = playerX;
    button.y = 55;
    panel.addChild(button);
    playerButtons.push(button);
    playerX += 120;
  });

  function updatePlayerButtons() {
    playerButtons.forEach((btn, i) => {
      btn.alpha = i === selectedPlayer ? 1 : 0.6;
    });
  }
  updatePlayerButtons();

  // Give section
  const giveLabel = new PIXI.Text("You give:", { 
    fontFamily: "Arial", 
    fontSize: 16, 
    fill: 0xffffff 
  });
  giveLabel.x = 20; 
  giveLabel.y = 110;
  panel.addChild(giveLabel);

  const giveControls = createResourceControls(giveResources, currentPlayer.resources, 20, 140);
  giveControls.forEach(control => panel.addChild(control));

  // Get section
  const getLabel = new PIXI.Text("You get:", { 
    fontFamily: "Arial", 
    fontSize: 16, 
    fill: 0xffffff 
  });
  getLabel.x = 20; 
  getLabel.y = 240;
  panel.addChild(getLabel);

  const getControls = createResourceControls(getResources, null, 20, 270);
  getControls.forEach(control => panel.addChild(control));

  // Buttons
  const sendButton = createTradeButton("Send Offer", () => {
    const targetPlayer = otherPlayers[selectedPlayer];
    const targetIndex = state.players.indexOf(targetPlayer);
    
    // Validate trade
    const giveTotal = Object.values(giveResources).reduce((sum, val) => sum + val, 0);
    const getTotal = Object.values(getResources).reduce((sum, val) => sum + val, 0);
    
    if (giveTotal === 0 && getTotal === 0) {
      if (hud.showResult) hud.showResult("Select resources to trade");
      return;
    }
    
    // Check if player has enough resources
    for (const [resource, amount] of Object.entries(giveResources)) {
      if (amount > (currentPlayer.resources[resource] || 0)) {
        if (hud.showResult) hud.showResult(`Not enough ${resource}`);
        return;
      }
    }
    
    closeDialog();
    showTradeOfferConfirmation(targetIndex, giveResources, getResources);
  });
  sendButton.x = 320;
  sendButton.y = 390;
  panel.addChild(sendButton);

  const cancelButton = createTradeButton("Cancel", closeDialog);
  cancelButton.x = 180;
  cancelButton.y = 390;
  panel.addChild(cancelButton);

  function closeDialog() {
    app.stage.removeChild(overlay);
    enableHUD(hud);
  }

  function showTradeOfferConfirmation(targetIndex, give, get) {
    const giveText = Object.entries(give)
      .filter(([_, amount]) => amount > 0)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(", ");
    
    const getText = Object.entries(get)
      .filter(([_, amount]) => amount > 0)
      .map(([resource, amount]) => `${amount} ${resource}`)
      .join(", ");
    
    // For now, just execute the trade immediately
    // In a full implementation, this would send an offer to the target player
    if (giveText && getText) {
      // Execute trade
      const targetPlayer = state.players[targetIndex];
      
      // Remove resources from current player
      Object.entries(give).forEach(([resource, amount]) => {
        currentPlayer.resources[resource] = (currentPlayer.resources[resource] || 0) - amount;
      });
      
      // Add resources to current player
      Object.entries(get).forEach(([resource, amount]) => {
        currentPlayer.resources[resource] = (currentPlayer.resources[resource] || 0) + amount;
      });
      
      // Update resource panel
      if (resPanel && resPanel.updateResources) {
        resPanel.updateResources(state.players);
      }
      
      if (hud.showResult) {
        hud.showResult(`Trade completed: Gave ${giveText}, Got ${getText}`);
      }
    }
  }

  // Position panel
  panel.x = (app.renderer.width - 600) / 2;
  panel.y = (app.renderer.height - 450) / 2;

  // Add to stage
  app.stage.addChild(overlay);

  // Helper function to create player buttons
  function createPlayerButton(text, onClick) {
    const button = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x374151);
    bg.drawRoundedRect(0, 0, 100, 30, 6);
    bg.endFill();
    button.addChild(bg);

    const label = new PIXI.Text(text, { 
      fontFamily: "Arial", 
      fontSize: 14, 
      fill: 0xffffff 
    });
    label.anchor.set(0.5);
    label.x = 50; 
    label.y = 15;
    button.addChild(label);

    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointertap', onClick);
    
    return button;
  }

  // Helper function to create resource controls
  function createResourceControls(resourceData, maxResources, startX, startY) {
    const controls = [];
    const resources = ['brick', 'wood', 'wheat', 'sheep', 'ore'];
    
    resources.forEach((resource, index) => {
      const container = new PIXI.Container();
      
      // Resource name
      const name = new PIXI.Text(resource, { 
        fontFamily: "Arial", 
        fontSize: 14, 
        fill: 0xffffff 
      });
      name.x = startX + index * 110;
      name.y = startY;
      controls.push(name);
      
      // Amount display
      const amountText = new PIXI.Text("0", { 
        fontFamily: "Arial", 
        fontSize: 16, 
        fill: 0xffffaa 
      });
      amountText.x = startX + index * 110 + 40;
      amountText.y = startY + 25;
      controls.push(amountText);
      
      // Minus button
      const minusBtn = createSmallButton("-", () => {
        if (resourceData[resource] > 0) {
          resourceData[resource]--;
          amountText.text = resourceData[resource].toString();
        }
      });
      minusBtn.x = startX + index * 110;
      minusBtn.y = startY + 50;
      controls.push(minusBtn);
      
      // Plus button
      const plusBtn = createSmallButton("+", () => {
        const canAdd = !maxResources || 
          resourceData[resource] < (maxResources[resource] || 0);
        if (canAdd) {
          resourceData[resource]++;
          amountText.text = resourceData[resource].toString();
        }
      });
      plusBtn.x = startX + index * 110 + 60;
      plusBtn.y = startY + 50;
      controls.push(plusBtn);
    });
    
    return controls;
  }

  function createSmallButton(text, onClick) {
    const button = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x4f46e5);
    bg.drawRoundedRect(0, 0, 25, 25, 4);
    bg.endFill();
    button.addChild(bg);

    const label = new PIXI.Text(text, { 
      fontFamily: "Arial", 
      fontSize: 14, 
      fill: 0xffffff 
    });
    label.anchor.set(0.5);
    label.x = 12.5; 
    label.y = 12.5;
    button.addChild(label);

    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointertap', onClick);
    
    return button;
  }

  function createTradeButton(text, onClick) {
    const button = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x2563eb);
    bg.drawRoundedRect(0, 0, 120, 40, 8);
    bg.endFill();
    button.addChild(bg);

    const label = new PIXI.Text(text, { 
      fontFamily: "Arial", 
      fontSize: 16, 
      fill: 0xffffff 
    });
    label.anchor.set(0.5);
    label.x = 60; 
    label.y = 20;
    button.addChild(label);

    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointertap', onClick);
    
    return button;
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a resource display component
 */
function createResourceDisplay(resources) {
  const container = createMaterialContainer({
    padding: MATERIAL_SPACING[2],
    gap: MATERIAL_SPACING[2],
    direction: 'horizontal'
  });

  // Background - much smaller
  const bg = new PIXI.Graphics();
  drawMaterialCard(bg, 300, 50, {
    elevation: 1,
    backgroundColor: MATERIAL_COLORS.surface.tertiary,
    borderRadius: 8
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
  
  // Background chip - smaller
  const bg = new PIXI.Graphics();
  drawMaterialChip(bg, 50, 30, {
    backgroundColor: getMaterialResourceColor(resource),
    variant: 'filled'
  });
  container.addChild(bg);

  // Resource initial
  const nameText = createMaterialText(resource.charAt(0).toUpperCase(), 'bodySmall', {
    fill: MATERIAL_COLORS.neutral[0]
  });
  nameText.x = 6;
  nameText.y = 4;
  container.addChild(nameText);

  // Amount
  const amountText = createMaterialText(amount.toString(), 'bodySmall', {
    fill: MATERIAL_COLORS.neutral[0]
  });
  amountText.x = 6;
  amountText.y = 16;
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

  return container;
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
 * Compute effective trading rates for current player based on owned ports
 */
function computeEffectiveRatesForCurrentPlayer(state, graph) {
  const me = state.players[state.currentPlayer - 1];
  const myVertices = new Set([...(me.settlements || []), ...(me.cities || [])]);
  const ports = state.ports || [];
  const defaultRates = { brick:4, wood:4, wheat:4, sheep:4, ore:4 };
  if (!graph || !graph.vertices || ports.length === 0 || myVertices.size === 0) return defaultRates;

  const portVertices = ports.map(p => {
    const vA = nearestVertexId(graph, p.edgePixels?.v1 || {x:0,y:0});
    const vB = nearestVertexId(graph, p.edgePixels?.v2 || {x:0,y:0});
    return new Set([vA, vB]);
  });

  let hasAnyPort = false;
  const hasResPort = { brick:false, wood:false, wheat:false, sheep:false, ore:false };

  ports.forEach((p, i) => {
    const verts = portVertices[i];
    for (const v of verts) {
      if (myVertices.has(v)) {
        if (p.type === "any") hasAnyPort = true;
        else if (hasResPort[p.type] !== undefined) hasResPort[p.type] = true;
        break;
      }
    }
  });

  const rates = { ...defaultRates };
  for (const k of Object.keys(rates)) {
    if (hasResPort[k]) rates[k] = 2;
    else if (hasAnyPort) rates[k] = 3;
  }
  return rates;
}

function nearestVertexId(graph, pt) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < graph.vertices.length; i++) {
    const v = graph.vertices[i];
    const dx = v.x - pt.x, dy = v.y - pt.y;
    const d = dx*dx + dy*dy;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
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
