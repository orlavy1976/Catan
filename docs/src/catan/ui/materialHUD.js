// docs/src/catan/ui/materialHUD.js
// 🎨 Material Design HUD with enhanced action buttons
// Modern replacement for the traditional HUD using Material Design system

import { createMaterialButton } from "./materialButton.js";
import { makeDiceView } from "./diceView.js";
import { createMaterialNotificationSystem } from "./materialNotifications.js";
import { 
  createMaterialText, 
  createMaterialContainer,
  animateScale 
} from "../../utils/materialUI.js";
import { 
  MATERIAL_COLORS, 
  MATERIAL_SPACING,
  MATERIAL_MOTION 
} from "../../config/materialDesign.js";

/**
 * Create a Material Design HUD
 * @param {PIXI.Application} app - PIXI application
 * @param {PIXI.Container} root - Root container
 * @param {Function} onRoll - Roll dice callback
 * @param {Function} onEndTurn - End turn callback
 * @param {Function} onBuildRoad - Build road callback
 * @param {Function} onBuildSettlement - Build settlement callback
 * @param {Function} onBuildCity - Build city callback
 * @param {Function} onTrade - Trade callback
 * @param {Function} onBuyDev - Buy dev card callback
 * @param {Function} onPlayDev - Play dev card callback
 * @returns {object} HUD API
 */
export function createMaterialHUD(app, root, onRoll, onEndTurn, onBuildRoad, onBuildSettlement, onBuildCity, onTrade, onBuyDev, onPlayDev) {
  const hud = new PIXI.Container();
  root.addChild(hud);
  
  // Enable z-index sorting for proper layering
  root.sortableChildren = true;

  // Layout constants
  const pad = MATERIAL_SPACING[5]; // 20px
  const gap = MATERIAL_SPACING[3]; // 12px
  const gapLarge = MATERIAL_SPACING[4]; // 16px
  const colWidth = 220; // Slightly wider for Material buttons

  // Create Material Design buttons with appropriate variants
  const rollBtn = createMaterialButton("Roll Dice", {
    variant: 'filled',
    size: 'large',
    width: 180,
  });

  const buildSettlementBtn = createMaterialButton("Build Settlement", {
    variant: 'filled',
    size: 'medium',
    width: 200,
  });

  const buildRoadBtn = createMaterialButton("Build Road", {
    variant: 'filled',
    size: 'medium',
    width: 180,
  });

  const buildCityBtn = createMaterialButton("Build City", {
    variant: 'filled',
    size: 'medium',
    width: 180,
  });

  const tradeBtn = createMaterialButton("Trade", {
    variant: 'outlined',
    size: 'medium',
    width: 160,
  });

  const buyDevBtn = createMaterialButton("Buy Dev Card", {
    variant: 'outlined',
    size: 'medium',
    width: 180,
  });

  const playDevBtn = createMaterialButton("Play Dev", {
    variant: 'outlined',
    size: 'medium',
    width: 160,
  });

  const endBtn = createMaterialButton("End Turn", {
    variant: 'text',
    size: 'large',
    width: 180,
  });

  // Store button references for easy access
  const colButtons = [
    rollBtn,
    buildSettlementBtn,
    buildRoadBtn,
    buildCityBtn,
    tradeBtn,
    buyDevBtn,
    playDevBtn,
    endBtn
  ];

  // Add all button containers to HUD
  colButtons.forEach(btn => hud.addChild(btn.container));

  // Dice view (keep existing)
  const dice = makeDiceView();
  hud.addChild(dice.container);

  // Material Design Notification System - add to root, not hud
  const notifications = createMaterialNotificationSystem(app);
  root.addChild(notifications.container);

  // Material Design text elements
  const bannerText = createMaterialText("", 'gameTitle');
  hud.addChild(bannerText);

  // Remove old bottomText and resultText - notifications handle this now

  // Layout function
  function layout() {
    const screenWidth = app.renderer.width;
    const screenHeight = app.renderer.height;
    
    // Responsive column positioning
    const scaleFactor = Math.min(1, screenWidth / 1200);
    const responsiveColWidth = Math.max(180, colWidth * scaleFactor);
    const responsivePad = Math.max(12, pad * scaleFactor);
    const responsiveGap = Math.max(8, gap * scaleFactor);
    const responsiveGapLarge = Math.max(12, gapLarge * scaleFactor);
    
    // Position action buttons column on the right
    const colX = screenWidth - responsivePad - responsiveColWidth;
    let cy = responsivePad;

    // Position dice with responsive sizing
    const diceW = Math.max(120, 150 * scaleFactor);
    dice.container.x = colX + Math.round((responsiveColWidth - diceW) / 2);
    dice.container.y = cy;
    cy += Math.max(100, 120 * scaleFactor) + responsiveGapLarge;

    // Position buttons with responsive Material spacing
    colButtons.forEach((btn, index) => {
      const buttonWidth = Math.max(160, btn.width * scaleFactor);
      const x = colX + Math.round((responsiveColWidth - buttonWidth) / 2);
      btn.container.x = x;
      btn.container.y = cy;
      
      // Scale button size if needed
      const buttonScale = Math.max(0.8, scaleFactor);
      btn.container.scale.set(buttonScale);
      
      cy += Math.max(40, btn.height * buttonScale) + responsiveGap;
    });

    // Position banner text responsively
    bannerText.x = responsivePad;
    bannerText.y = responsivePad;
    
    // Responsive text sizing
    const textScale = Math.max(0.8, scaleFactor);
    bannerText.scale.set(textScale);
    
    // Ensure buttons don't go off-screen on short screens
    if (cy > screenHeight - 50) {
      const overflow = cy - (screenHeight - 50);
      const buttonCount = colButtons.length;
      const spacingReduction = Math.min(responsiveGap * 0.5, overflow / buttonCount);
      
      // Re-layout with reduced spacing
      cy = responsivePad + Math.max(100, 120 * scaleFactor) + responsiveGapLarge;
      colButtons.forEach((btn, index) => {
        const buttonWidth = Math.max(160, btn.width * scaleFactor);
        const x = colX + Math.round((responsiveColWidth - buttonWidth) / 2);
        btn.container.x = x;
        btn.container.y = cy;
        cy += Math.max(40, btn.height * Math.max(0.8, scaleFactor)) + (responsiveGap - spacingReduction);
      });
    }
    
    // Layout notification system
    notifications.layout();
    
    console.log("🎨 HUD layout - Screen:", `${screenWidth}x${screenHeight}`, "Scale:", scaleFactor.toFixed(2), "ColX:", colX);
  }

  // Initial layout
  layout();
  
  // Re-layout on window resize
  window.addEventListener("resize", layout);

  // Enhanced button interactions with Material animations
  function addMaterialFeedback(button, callback) {
    button.onClick(async () => {
      // Add extra visual feedback
      await animateScale(button.container, 0.95, 80);
      await animateScale(button.container, 1, 80);
      callback?.();
    });
  }

  // Wire up button callbacks with Material feedback
  rollBtn.onClick(async () => {
    // Special animation for roll dice
    await animateScale(rollBtn.container, 1.05, 100);
    
    // Start dice shake animation (will be finished after onRoll sets the values)
    const shakePromise = dice.shake(600);
    
    // Call the roll callback to get dice values
    onRoll?.();
    
    // Wait for shake to complete
    await shakePromise;
    
    await animateScale(rollBtn.container, 1, 100);
  });

  addMaterialFeedback(endBtn, onEndTurn);
  addMaterialFeedback(buildRoadBtn, onBuildRoad);
  addMaterialFeedback(buildSettlementBtn, onBuildSettlement);
  addMaterialFeedback(buildCityBtn, onBuildCity);
  addMaterialFeedback(tradeBtn, onTrade);
  addMaterialFeedback(buyDevBtn, onBuyDev);
  addMaterialFeedback(playDevBtn, onPlayDev);

  // Public API functions
  function setBanner(text) {
    bannerText.text = text;
  }

  function setBottom(text) {
    // Only use the new action instruction panel
    notifications.setActionText(text);
  }

  function showResult(text, type = 'info', duration = 4000) {
    // Only use the new notification system now
    notifications.addNotification(text, type, duration);
  }

  // Enhanced notification functions
  function showSuccess(text, duration = 3000) {
    showResult(text, 'success', duration);
  }

  function showWarning(text, duration = 5000) {
    showResult(text, 'warning', duration);
  }

  function showError(text, duration = 6000) {
    showResult(text, 'error', duration);
  }

  function showInfo(text, duration = 4000) {
    showResult(text, 'info', duration);
  }

  // Button state management functions
  function setRollEnabled(enabled) {
    rollBtn.setEnabled(enabled);
    if (!enabled) dice.clear();
  }

  function setEndEnabled(enabled) {
    endBtn.setEnabled(enabled);
  }

  function setBuildRoadEnabled(enabled) {
    buildRoadBtn.setEnabled(enabled);
  }

  function setBuildSettlementEnabled(enabled) {
    buildSettlementBtn.setEnabled(enabled);
  }

  function setBuildCityEnabled(enabled) {
    buildCityBtn.setEnabled(enabled);
  }

  function setTradeEnabled(enabled) {
    tradeBtn.setEnabled(enabled);
  }

  function setBuyDevEnabled(enabled) {
    buyDevBtn.setEnabled(enabled);
  }

  function setPlayDevEnabled(enabled) {
    playDevBtn.setEnabled(enabled);
  }

  // Add visual state indicators for better UX
  function updateButtonStates() {
    // This could be expanded to show more visual feedback
    // like changing button colors based on resource availability
  }

  return {
    container: hud,
    layout,
    dice,
    setBanner,
    setBottom,
    showResult,
    
    // Enhanced notification methods
    showSuccess,
    showWarning,
    showError,
    showInfo,
    
    // Direct access to notification system
    notifications,
    
    setRollEnabled,
    setEndEnabled,
    setBuildRoadEnabled,
    setBuildSettlementEnabled,
    setBuildCityEnabled,
    setTradeEnabled,
    setBuyDevEnabled,
    setPlayDevEnabled,
    updateButtonStates, // New function for enhanced state management
  };
}
