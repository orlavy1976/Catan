// docs/src/catan/ui/materialNotifications.js
// 🔔 Material Design Notification System
// Advanced notification panel with history and improved visibility

import { 
  MATERIAL_COLORS, 
  MATERIAL_TYPOGRAPHY,
  MATERIAL_SPACING,
  MATERIAL_SHADOWS,
  MATERIAL_MOTION
} from '../../config/materialDesign.js';

import { 
  createMaterialText,
  createMaterialContainer,
  drawMaterialCard,
  animateScale,
  animateFade,
  animateSlide,
  fadeIn,
  fadeOut,
  EASING
} from '../../utils/materialUI.js';

import { createMaterialButton } from './materialButton.js';

/**
 * Create Material Design notification system
 * @param {PIXI.Application} app - The PixiJS application
 * @returns {object} Notification system API
 */
export function createMaterialNotificationSystem(app) {
  const container = new PIXI.Container();
  
  // Ensure notifications render on top of other UI elements
  container.zIndex = 999;
  container.sortableChildren = true;
  
  // Configuration
  const MAX_HISTORY = 20;
  const NOTIFICATION_WIDTH = 350;
  const NOTIFICATION_HEIGHT = 60;
  const ACTION_PANEL_WIDTH = 300;
  const ACTION_PANEL_HEIGHT = 50;
  const PANEL_WIDTH = 450;
  const PANEL_MAX_HEIGHT = 500;
  
  // State
  let notifications = [];
  let isHistoryVisible = false;
  let currentNotification = null;
  let currentActionText = "";
  
  // UI Elements
  let mainNotificationCard = null;
  let actionInstructionPanel = null;
  let historyPanel = null;
  let historyContainer = null;
  let toggleButton = null;
  
  // Initialize the system
  init();
  
  // Test notification to verify the system works
  setTimeout(() => {
    addNotification("🔔 Notification system initialized!", 'info', 3000);
  }, 1000);
  
  function init() {
    createMainNotification();
    createActionInstructionPanel();
    createHistoryPanel();
    createToggleButton();
    layout();
  }
  
  /**
   * Create the main floating notification card
   */
  function createMainNotification() {
    mainNotificationCard = createMaterialContainer();
    
    // Background card
    const bg = new PIXI.Graphics();
    drawMaterialCard(bg, NOTIFICATION_WIDTH, NOTIFICATION_HEIGHT, {
      elevation: 6,
      color: MATERIAL_COLORS.surface.tertiary,
      cornerRadius: 16
    });
    mainNotificationCard.addChild(bg);
    
    // Notification text
    const notificationText = createMaterialText("", 'bodyLarge', {
      fill: MATERIAL_COLORS.neutral[0],
      wordWrap: true,
      wordWrapWidth: NOTIFICATION_WIDTH - MATERIAL_SPACING[4]
    });
    notificationText.x = MATERIAL_SPACING[3];
    notificationText.y = MATERIAL_SPACING[3];
    mainNotificationCard.addChild(notificationText);
    
    // Priority indicator (colored left border)
    const priorityIndicator = new PIXI.Graphics();
    mainNotificationCard.addChild(priorityIndicator);
    
    // Timestamp
    const timestampText = createMaterialText("", 'bodySmall', {
      fill: MATERIAL_COLORS.neutral[400]
    });
    timestampText.x = NOTIFICATION_WIDTH - MATERIAL_SPACING[3];
    timestampText.y = NOTIFICATION_HEIGHT - MATERIAL_SPACING[3];
    timestampText.anchor.set(1, 1);
    mainNotificationCard.addChild(timestampText);
    
    // Store references
    mainNotificationCard.notificationText = notificationText;
    mainNotificationCard.priorityIndicator = priorityIndicator;
    mainNotificationCard.timestampText = timestampText;
    
    // Set initial default message
    notificationText.text = "No recent notifications";
    timestampText.text = "";
    
    // Initially visible and positioned permanently
    mainNotificationCard.visible = true;
    mainNotificationCard.alpha = 1;
    
    container.addChild(mainNotificationCard);
  }
  
  /**
   * Create the action instruction panel
   */
  function createActionInstructionPanel() {
    actionInstructionPanel = createMaterialContainer();
    
    // Background card
    const bg = new PIXI.Graphics();
    drawMaterialCard(bg, ACTION_PANEL_WIDTH, ACTION_PANEL_HEIGHT, {
      elevation: 4,
      color: MATERIAL_COLORS.surface.secondary,
      cornerRadius: 12
    });
    actionInstructionPanel.addChild(bg);
    
    // Action text
    const actionText = createMaterialText("", 'bodyMedium', {
      fill: MATERIAL_COLORS.neutral[0],
      wordWrap: true,
      wordWrapWidth: ACTION_PANEL_WIDTH - MATERIAL_SPACING[3]
    });
    actionText.x = MATERIAL_SPACING[2];
    actionText.y = MATERIAL_SPACING[2];
    actionInstructionPanel.addChild(actionText);
    
    // Store reference
    actionInstructionPanel.actionText = actionText;
    
    // Set initial text
    actionText.text = "Ready: Roll Dice";
    
    // Initially visible
    actionInstructionPanel.visible = true;
    actionInstructionPanel.alpha = 1;
    
    container.addChild(actionInstructionPanel);
  }
  
  /**
   * Create the notification history panel
   */
  function createHistoryPanel() {
    historyPanel = createMaterialContainer();
    
    // Background
    const bg = new PIXI.Graphics();
    drawMaterialCard(bg, PANEL_WIDTH, PANEL_MAX_HEIGHT, {
      elevation: 8,
      color: MATERIAL_COLORS.surface.primary,
      cornerRadius: 20
    });
    historyPanel.addChild(bg);
    
    // Header
    const headerText = createMaterialText("Notification History", 'titleMedium', {
      fill: MATERIAL_COLORS.neutral[0]
    });
    headerText.x = MATERIAL_SPACING[3];
    headerText.y = MATERIAL_SPACING[3];
    historyPanel.addChild(headerText);
    
    // Clear all button
    const clearButton = createMaterialButton("Clear All", {
      variant: 'text',
      size: 'small'
    });
    clearButton.container.x = PANEL_WIDTH - MATERIAL_SPACING[3] - 80;
    clearButton.container.y = MATERIAL_SPACING[3]; // Align with header
    clearButton.onClick(() => clearHistory());
    historyPanel.addChild(clearButton.container);
    
    // Scrollable container for notifications
    historyContainer = new PIXI.Container();
    historyContainer.x = MATERIAL_SPACING[2];
    historyContainer.y = MATERIAL_SPACING[8]; // More space below header and clear button
    
    // Create mask for scrolling
    const mask = new PIXI.Graphics();
    mask.beginFill(0xFFFFFF);
    mask.drawRect(0, MATERIAL_SPACING[8], PANEL_WIDTH, PANEL_MAX_HEIGHT - MATERIAL_SPACING[10]);
    mask.endFill();
    historyPanel.addChild(mask);
    historyContainer.mask = mask;
    
    historyPanel.addChild(historyContainer);
    
    // Initially hidden
    historyPanel.visible = false;
    historyPanel.alpha = 0;
    
    container.addChild(historyPanel);
  }
  
  /**
   * Create the toggle button for history panel
   */
  function createToggleButton() {
    toggleButton = createMaterialButton("📋 History", {
      variant: 'filled',  // More prominent variant
      size: 'medium',
      width: 120
    });
    
    console.log("🔔 Toggle button created:", toggleButton);
    
    toggleButton.onClick(() => {
      console.log("🔔 Toggle button clicked, current state:", isHistoryVisible);
      toggleHistory();
    });
    
    // Make sure it's always visible and on top
    toggleButton.container.visible = true;
    toggleButton.container.alpha = 1;
    toggleButton.container.zIndex = 1001; // Higher than container base z-index
    
    container.addChild(toggleButton.container);
  }
  
  /**
   * Add a new notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('info', 'success', 'warning', 'error')
   * @param {number} duration - How long to show (ms), 0 = permanent
   */
  function addNotification(message, type = 'info', duration = 4000) {
    console.log("🔔 Adding notification:", { message, type, duration });
    
    const timestamp = new Date();
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp,
      duration
    };
    
    // Add to history
    notifications.unshift(notification);
    if (notifications.length > MAX_HISTORY) {
      notifications = notifications.slice(0, MAX_HISTORY);
    }
    
    console.log("🔔 Notifications array now has", notifications.length, "items");
    
    // Update displays
    showMainNotification(notification);
    updateHistoryDisplay();
    updateToggleButton();
    
    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => hideMainNotification(), duration);
    }
  }
  
  /**
   * Update the toggle button with current notification count
   */
  function updateToggleButton() {
    if (toggleButton && toggleButton.buttonText) {
      toggleButton.buttonText.text = `📋 History (${notifications.length})`;
    }
  }
  
  /**
   * Show notification in main card
   */
  function showMainNotification(notification) {
    currentNotification = notification;
    
    const { notificationText, priorityIndicator, timestampText } = mainNotificationCard;
    
    // Set text
    notificationText.text = notification.message;
    timestampText.text = formatTime(notification.timestamp);
    
    // Set priority indicator color
    priorityIndicator.clear();
    const priorityColor = getPriorityColor(notification.type);
    priorityIndicator.beginFill(priorityColor);
    priorityIndicator.drawRect(0, 8, 4, NOTIFICATION_HEIGHT - 16);
    priorityIndicator.endFill();
    
    // Panel is always visible, just do a subtle pulse animation
    animateScale(mainNotificationCard, 1.02, 200).then(() => {
      animateScale(mainNotificationCard, 1, 200);
    });
  }
  
  /**
   * Hide main notification (now just clears content since panel is permanent)
   */
  function hideMainNotification() {
    // Don't hide the panel, just show a default message
    const { notificationText, priorityIndicator, timestampText } = mainNotificationCard;
    
    notificationText.text = "No recent notifications";
    timestampText.text = "";
    priorityIndicator.clear();
    
    currentNotification = null;
  }
  
  /**
   * Update the history panel display
   */
  function updateHistoryDisplay() {
    console.log("🔔 updateHistoryDisplay called with", notifications.length, "notifications");
    
    // Clear existing history items
    historyContainer.removeChildren();
    
    let y = 0;
    notifications.forEach((notification, index) => {
      console.log("🔔 Creating history item", index, ":", notification.message);
      const item = createHistoryItem(notification, index);
      item.y = y;
      historyContainer.addChild(item);
      y += 70; // Height of each history item
    });
    
    console.log("🔔 History container now has", historyContainer.children.length, "items");
  }
  
  /**
   * Create a single history item
   */
  function createHistoryItem(notification, index) {
    const item = createMaterialContainer();
    const itemHeight = 60;
    const itemWidth = PANEL_WIDTH - MATERIAL_SPACING[4];
    
    // Background with alternating colors
    const bg = new PIXI.Graphics();
    const bgColor = index % 2 === 0 ? MATERIAL_COLORS.surface.secondary : MATERIAL_COLORS.surface.tertiary;
    bg.beginFill(bgColor);
    bg.drawRoundedRect(0, 0, itemWidth, itemHeight, 8);
    bg.endFill();
    item.addChild(bg);
    
    // Priority indicator
    const indicator = new PIXI.Graphics();
    const priorityColor = getPriorityColor(notification.type);
    indicator.beginFill(priorityColor);
    indicator.drawRect(0, 8, 4, itemHeight - 16);
    indicator.endFill();
    item.addChild(indicator);
    
    // Message text
    const messageText = createMaterialText(notification.message, 'bodyMedium', {
      fill: MATERIAL_COLORS.neutral[0],
      wordWrap: true,
      wordWrapWidth: itemWidth - 60
    });
    messageText.x = MATERIAL_SPACING[2];
    messageText.y = MATERIAL_SPACING[2];
    item.addChild(messageText);
    
    // Timestamp
    const timeText = createMaterialText(formatTime(notification.timestamp), 'bodySmall', {
      fill: MATERIAL_COLORS.neutral[400]
    });
    timeText.x = itemWidth - MATERIAL_SPACING[2];
    timeText.y = itemHeight - MATERIAL_SPACING[2];
    timeText.anchor.set(1, 1);
    item.addChild(timeText);
    
    // Type badge
    const typeBadge = createMaterialText(notification.type.toUpperCase(), 'labelSmall', {
      fill: MATERIAL_COLORS.neutral[0]
    });
    typeBadge.x = itemWidth - MATERIAL_SPACING[2];
    typeBadge.y = MATERIAL_SPACING[2];
    typeBadge.anchor.set(1, 0);
    item.addChild(typeBadge);
    
    return item;
  }
  
  /**
   * Toggle history panel visibility
   */
  function toggleHistory() {
    console.log("🔔 toggleHistory called, current state:", isHistoryVisible);
    isHistoryVisible = !isHistoryVisible;
    
    if (isHistoryVisible) {
      console.log("🔔 Showing history panel");
      updateHistoryDisplay();
      showHistoryPanel();
    } else {
      console.log("🔔 Hiding history panel");
      hideHistoryPanel();
    }
  }
  
  /**
   * Show history panel with animation
   */
  function showHistoryPanel() {
    console.log("🔔 showHistoryPanel called");
    console.log("🔔 historyPanel properties:", {
      visible: historyPanel.visible,
      alpha: historyPanel.alpha,
      x: historyPanel.x,
      y: historyPanel.y,
      width: PANEL_WIDTH,
      height: PANEL_MAX_HEIGHT
    });
    
    historyPanel.visible = true;
    historyPanel.alpha = 1;
    
    // Position it directly without animation for now (debugging)
    const pad = MATERIAL_SPACING[3];
    historyPanel.x = app.renderer.width - PANEL_WIDTH - pad;
    historyPanel.y = pad;
    
    console.log("🔔 historyPanel positioned at:", historyPanel.x, historyPanel.y);
    console.log("🔔 App renderer size:", app.renderer.width, app.renderer.height);
    
    // Try animation after direct positioning
    // animatePanelIn();
  }
  
  /**
   * Hide history panel with animation
   */
  function hideHistoryPanel() {
    animatePanelOut().then(() => {
      historyPanel.visible = false;
    });
  }
  
  /**
   * Update action instruction text
   * @param {string} text - Action instruction text
   */
  function setActionText(text) {
    if (actionInstructionPanel && actionInstructionPanel.actionText) {
      actionInstructionPanel.actionText.text = text;
      currentActionText = text;
      
      // Subtle pulse animation for new instructions
      animateScale(actionInstructionPanel, 1.02, 150).then(() => {
        animateScale(actionInstructionPanel, 1, 150);
      });
    }
  }
  
  /**
   * Clear action instruction text
   */
  function clearActionText() {
    setActionText("");
  }
  
  /**
   * Clear all notification history
   */
  function clearHistory() {
    notifications = [];
    updateHistoryDisplay();
    updateToggleButton();
  }
  
  /**
   * Get priority color based on notification type
   */
  function getPriorityColor(type) {
    switch (type) {
      case 'success': return MATERIAL_COLORS.semantic.success;
      case 'warning': return MATERIAL_COLORS.semantic.warning;
      case 'error': return MATERIAL_COLORS.semantic.error;
      case 'info':
      default: return MATERIAL_COLORS.primary[500];
    }
  }
  
  /**
   * Format timestamp for display
   */
  function formatTime(timestamp) {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  /**
   * Animation: Notification slide in from top
   */
  async function animateNotificationIn() {
    mainNotificationCard.y = -NOTIFICATION_HEIGHT;
    mainNotificationCard.alpha = 0;
    
    const targetY = MATERIAL_SPACING[3];
    
    return Promise.all([
      animateSlide(mainNotificationCard, { x: mainNotificationCard.x, y: targetY }, MATERIAL_MOTION.duration.medium, 'easeOutQuart'),
      animateFade(mainNotificationCard, 1, MATERIAL_MOTION.duration.medium, 'easeOutQuart')
    ]);
  }
  
  /**
   * Animation: Notification slide out to top
   */
  async function animateNotificationOut() {
    const startY = mainNotificationCard.y;
    const targetY = startY - (NOTIFICATION_HEIGHT + MATERIAL_SPACING[3]);
    
    return Promise.all([
      animateSlide(mainNotificationCard, { x: mainNotificationCard.x, y: targetY }, MATERIAL_MOTION.duration.short, 'easeInQuart'),
      animateFade(mainNotificationCard, 0, MATERIAL_MOTION.duration.short, 'easeInQuart')
    ]);
  }
  
  /**
   * Animation: History panel slide in from right
   */
  async function animatePanelIn() {
    historyPanel.x = app.renderer.width;
    historyPanel.alpha = 0;
    
    const targetX = app.renderer.width - PANEL_WIDTH - MATERIAL_SPACING[3];
    
    return Promise.all([
      animateSlide(historyPanel, { x: targetX, y: historyPanel.y }, MATERIAL_MOTION.duration.medium, 'easeOutQuart'),
      animateFade(historyPanel, 1, MATERIAL_MOTION.duration.medium, 'easeOutQuart')
    ]);
  }
  
  /**
   * Animation: History panel slide out to right
   */
  async function animatePanelOut() {
    const startX = historyPanel.x;
    const targetX = startX + PANEL_WIDTH + MATERIAL_SPACING[3];
    
    return Promise.all([
      animateSlide(historyPanel, { x: targetX, y: historyPanel.y }, MATERIAL_MOTION.duration.short, 'easeInQuart'),
      animateFade(historyPanel, 0, MATERIAL_MOTION.duration.short, 'easeInQuart')
    ]);
  }
  
  /**
   * Layout all notification elements
   */
  function layout() {
    const screenWidth = app.renderer.width;
    const screenHeight = app.renderer.height;
    
    // Responsive padding and sizing
    const basePad = MATERIAL_SPACING[3];
    const scaleFactor = Math.min(1, screenWidth / 1200);
    const pad = Math.max(12, basePad * scaleFactor);
    
    // Responsive panel dimensions
    const responsiveNotificationWidth = Math.max(280, NOTIFICATION_WIDTH * scaleFactor);
    const responsivePanelWidth = Math.max(300, PANEL_WIDTH * scaleFactor);
    const responsiveActionHeight = Math.max(40, ACTION_PANEL_HEIGHT * scaleFactor);
    const responsiveNotificationHeight = Math.max(50, NOTIFICATION_HEIGHT * scaleFactor);
    
    console.log("🔔 Responsive notification layout", {
      screenSize: `${screenWidth}x${screenHeight}`,
      scaleFactor: scaleFactor.toFixed(2),
      responsiveWidths: { notification: responsiveNotificationWidth, panel: responsivePanelWidth }
    });
    
    // Action instruction panel at top left (under banner text)
    actionInstructionPanel.x = pad;
    actionInstructionPanel.y = pad * 6; // Responsive offset below banner
    
    // Resize action panel background if needed
    if (actionInstructionPanel.children[0] && actionInstructionPanel.children[0].clear) {
      const bg = actionInstructionPanel.children[0];
      bg.clear();
      bg.beginFill(MATERIAL_COLORS.surfaceContainer, 0.9);
      bg.drawRoundedRect(0, 0, responsiveNotificationWidth, responsiveActionHeight, MATERIAL_SPACING[2]);
      bg.endFill();
    }
    
    // Main notification panel below action panel
    mainNotificationCard.x = pad;
    mainNotificationCard.y = actionInstructionPanel.y + responsiveActionHeight + MATERIAL_SPACING[2];
    
    // Resize main notification background if needed
    if (mainNotificationCard.children[0] && mainNotificationCard.children[0].clear) {
      const bg = mainNotificationCard.children[0];
      bg.clear();
      bg.beginFill(MATERIAL_COLORS.surfaceContainer, 0.9);
      bg.drawRoundedRect(0, 0, responsiveNotificationWidth, responsiveNotificationHeight, MATERIAL_SPACING[2]);
      bg.endFill();
    }
    
    // History panel positioning - responsive to screen size
    if (screenWidth > 1000) {
      // Large screens: top right
      historyPanel.x = screenWidth - responsivePanelWidth - pad;
      historyPanel.y = pad;
    } else {
      // Smaller screens: below notifications on left
      historyPanel.x = pad;
      historyPanel.y = mainNotificationCard.y + responsiveNotificationHeight + MATERIAL_SPACING[3];
    }
    
    // Resize history panel if needed
    if (historyPanel.background && historyPanel.background.clear) {
      const bg = historyPanel.background;
      const panelHeight = Math.min(500 * scaleFactor, screenHeight * 0.6);
      bg.clear();
      bg.beginFill(MATERIAL_COLORS.surface, 0.95);
      bg.drawRoundedRect(0, 0, responsivePanelWidth, panelHeight, MATERIAL_SPACING[3]);
      bg.endFill();
    }
    
    // Toggle button positioning
    const toggleY = screenWidth > 1000 
      ? mainNotificationCard.y + responsiveNotificationHeight + MATERIAL_SPACING[2]
      : historyPanel.y + 400 + MATERIAL_SPACING[2]; // Below history on small screens
      
    toggleButton.container.x = pad;
    toggleButton.container.y = toggleY;
    toggleButton.container.zIndex = 1000;
    
    // Ensure panels don't go off-screen
    if (historyPanel.y + 400 > screenHeight) {
      historyPanel.y = Math.max(pad, screenHeight - 450);
    }
    
    console.log("📱 Layout complete - Notification:", { x: mainNotificationCard.x, y: mainNotificationCard.y }, "History:", { x: historyPanel.x, y: historyPanel.y });
  }
  

  
  // Re-layout on window resize
  window.addEventListener("resize", layout);
  
  // Public API
  return {
    container,
    layout,
    addNotification,
    clearHistory,
    
    // Action instruction functions
    setActionText,
    clearActionText,
    
    // Convenience methods for different notification types
    info: (message, duration) => addNotification(message, 'info', duration),
    success: (message, duration) => addNotification(message, 'success', duration),
    warning: (message, duration) => addNotification(message, 'warning', duration),
    error: (message, duration) => addNotification(message, 'error', duration),
    
    // Show/hide methods
    show: () => { container.visible = true; },
    hide: () => { container.visible = false; },
    
    // Toggle history externally
    toggleHistory,
    
    // Get current state
    get isHistoryVisible() { return isHistoryVisible; },
    get notificationCount() { return notifications.length; },
    get currentNotification() { return currentNotification; },
    get currentActionText() { return currentActionText; }
  };
}
