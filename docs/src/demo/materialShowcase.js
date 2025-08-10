// docs/src/demo/materialShowcase.js
// 🎨 Material Design Showcase
// Demo page to showcase the new Material Design system

import { 
  createMaterialButton, 
  createFloatingActionButton, 
  createIconButton 
} from "../catan/ui/materialButton.js";

import { 
  createMaterialContainer,
  createMaterialText,
  createMaterialHeadline,
  drawMaterialCard,
  animateScale,
  animateFade
} from "../utils/materialUI.js";

import { 
  MATERIAL_COLORS, 
  MATERIAL_SPACING,
  MATERIAL_MOTION
} from "../config/materialDesign.js";

/**
 * Create a Material Design showcase
 * @param {PIXI.Application} app - PIXI application
 * @param {PIXI.Container} parent - Parent container
 */
export function createMaterialShowcase(app, parent) {
  console.log('Creating Material showcase');
  
  // Main showcase container
  const showcase = new PIXI.Container();
  showcase.x = 100;
  showcase.y = 100;
  parent.addChild(showcase);
  
  // Simple background card
  const cardBg = new PIXI.Graphics();
  cardBg.beginFill(MATERIAL_COLORS.surface.secondary, 0.95);
  cardBg.drawRoundedRect(0, 0, 600, 400, 16);
  cardBg.endFill();
  
  // Add border
  cardBg.lineStyle(2, MATERIAL_COLORS.neutral[600], 0.3);
  cardBg.drawRoundedRect(0, 0, 600, 400, 16);
  
  showcase.addChild(cardBg);
  
  // Title
  const title = createMaterialText('Material Design System', 'gameTitle');
  title.x = 30;
  title.y = 30;
  showcase.addChild(title);
  
  // Subtitle
  const subtitle = createMaterialText('Modern HD graphics with Material Design 3 principles', 'bodyLarge', {
    fill: MATERIAL_COLORS.neutral[400]
  });
  subtitle.x = 30;
  subtitle.y = 70;
  showcase.addChild(subtitle);
  
  // Create some demo buttons
  let yPos = 120;
  const buttonSpacing = 60;
  
  // Filled button
  const filledButton = createMaterialButton('Primary Action', {
    variant: 'filled',
    size: 'medium',
  });
  filledButton.container.x = 30;
  filledButton.container.y = yPos;
  filledButton.onClick(() => {
    console.log('Filled button clicked!');
    animateScale(filledButton.container, 1.1, 100).then(() => {
      animateScale(filledButton.container, 1, 100);
    });
  });
  showcase.addChild(filledButton.container);
  
  // Outlined button
  yPos += buttonSpacing;
  const outlinedButton = createMaterialButton('Secondary Action', {
    variant: 'outlined',
    size: 'medium',
  });
  outlinedButton.container.x = 30;
  outlinedButton.container.y = yPos;
  outlinedButton.onClick(() => {
    console.log('Outlined button clicked!');
    animateScale(outlinedButton.container, 1.1, 100).then(() => {
      animateScale(outlinedButton.container, 1, 100);
    });
  });
  showcase.addChild(outlinedButton.container);
  
  // Text button
  yPos += buttonSpacing;
  const textButton = createMaterialButton('Text Action', {
    variant: 'text',
    size: 'medium',
  });
  textButton.container.x = 30;
  textButton.container.y = yPos;
  textButton.onClick(() => {
    console.log('Text button clicked!');
    animateScale(textButton.container, 1.1, 100).then(() => {
      animateScale(textButton.container, 1, 100);
    });
  });
  showcase.addChild(textButton.container);
  
  // Close button
  const closeButton = createMaterialButton('Close', {
    variant: 'text',
    size: 'small',
  });
  closeButton.container.x = 520;
  closeButton.container.y = 20;
  closeButton.onClick(() => {
    console.log('Close button clicked');
    animateFade(showcase, 0, MATERIAL_MOTION.duration.normal).then(() => {
      if (parent.children.includes(showcase)) {
        parent.removeChild(showcase);
      }
    });
  });
  showcase.addChild(closeButton.container);
  
  // Entrance animation
  showcase.alpha = 0;
  showcase.scale.set(0.9);
  animateFade(showcase, 1, MATERIAL_MOTION.duration.normal);
  animateScale(showcase, 1, MATERIAL_MOTION.duration.normal, 'emphasized');
  
  console.log('Material showcase created successfully');
  return showcase;
}

/**
 * Create title section
 */
function createTitleSection() {
  const container = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[2],
    direction: 'vertical'
  });
  
  // Main title
  const title = createMaterialHeadline('Material Design System', 'large');
  container.materialLayout.addChild(title);
  
  // Subtitle
  const subtitle = createMaterialText('Modern HD graphics with Material Design 3 principles', 'bodyLarge', {
    fill: MATERIAL_COLORS.neutral[400]
  });
  container.materialLayout.addChild(subtitle);
  
  return container.container;
}

/**
 * Create button showcase section
 */
function createButtonSection() {
  const container = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[4],
    direction: 'vertical'
  });
  
  // Section title
  const sectionTitle = createMaterialText('Button Variants', 'sectionHeader');
  container.materialLayout.addChild(sectionTitle);
  
  // Filled buttons row
  const filledRow = createButtonRow([
    { label: 'Primary Action', variant: 'filled', size: 'large' },
    { label: 'Build Road', variant: 'filled', size: 'medium' },
    { label: 'Trade', variant: 'filled', size: 'small' },
  ]);
  container.materialLayout.addChild(filledRow);
  
  // Outlined buttons row
  const outlinedRow = createButtonRow([
    { label: 'Secondary Action', variant: 'outlined', size: 'large' },
    { label: 'Cancel Trade', variant: 'outlined', size: 'medium' },
    { label: 'Skip', variant: 'outlined', size: 'small' },
  ]);
  container.materialLayout.addChild(outlinedRow);
  
  // Text buttons row
  const textRow = createButtonRow([
    { label: 'Tertiary Action', variant: 'text', size: 'large' },
    { label: 'More Info', variant: 'text', size: 'medium' },
    { label: 'Help', variant: 'text', size: 'small' },
  ]);
  container.materialLayout.addChild(textRow);
  
  return container.container;
}

/**
 * Create interactive demo section
 */
function createInteractiveSection() {
  const container = createMaterialContainer({
    padding: 0,
    gap: MATERIAL_SPACING[4],
    direction: 'vertical'
  });
  
  // Section title
  const sectionTitle = createMaterialText('Interactive Demo', 'sectionHeader');
  container.materialLayout.addChild(sectionTitle);
  
  // Demo buttons with functionality
  const demoRow = new PIXI.Container();
  
  // Counter demo
  let counter = 0;
  const counterButton = createMaterialButton(`Count: ${counter}`, {
    variant: 'filled',
    size: 'medium',
  });
  counterButton.onClick(() => {
    counter++;
    counterButton.setText(`Count: ${counter}`);
    animateScale(counterButton.container, 1.1, 100).then(() => {
      animateScale(counterButton.container, 1, 100);
    });
  });
  demoRow.addChild(counterButton.container);
  
  // Toggle demo
  let isToggled = false;
  const toggleButton = createMaterialButton('Toggle Me', {
    variant: 'outlined',
    size: 'medium',
  });
  toggleButton.container.x = counterButton.width + MATERIAL_SPACING[4];
  toggleButton.onClick(() => {
    isToggled = !isToggled;
    toggleButton.setText(isToggled ? 'Toggled!' : 'Toggle Me');
    // Change variant by recreating (in real app, you'd have a method for this)
  });
  demoRow.addChild(toggleButton.container);
  
  // Disabled demo
  const disabledButton = createMaterialButton('Disabled', {
    variant: 'filled',
    size: 'medium',
    disabled: true,
  });
  disabledButton.container.x = toggleButton.container.x + toggleButton.width + MATERIAL_SPACING[4];
  demoRow.addChild(disabledButton.container);
  
  container.materialLayout.addChild(demoRow);
  
  // Floating action button demo
  const fabContainer = new PIXI.Container();
  const fabLabel = createMaterialText('Floating Action Button:', 'bodyMedium');
  fabContainer.addChild(fabLabel);
  
  const fab = createFloatingActionButton(null, {
    size: 'medium',
  });
  fab.container.x = fabLabel.width + MATERIAL_SPACING[4];
  fab.container.y = -8; // Center with text
  fab.onClick(() => {
    animateScale(fab.container, 1.2, 150).then(() => {
      animateScale(fab.container, 1, 150);
    });
  });
  fabContainer.addChild(fab.container);
  
  // Add FAB text (+ symbol)
  const fabText = createMaterialText('+', 'buttonLarge', { fontSize: 24 });
  fabText.anchor.set(0.5);
  fabText.x = 28;
  fabText.y = 28;
  fab.container.addChild(fabText);
  
  container.materialLayout.addChild(fabContainer);
  
  return container.container;
}

/**
 * Create a row of buttons
 */
function createButtonRow(buttonConfigs) {
  const row = new PIXI.Container();
  let currentX = 0;
  
  buttonConfigs.forEach((config, index) => {
    const button = createMaterialButton(config.label, config);
    button.container.x = currentX;
    
    // Add some demo functionality
    button.onClick(() => {
      console.log(`${config.label} clicked!`);
      // Visual feedback
      animateScale(button.container, 0.95, 100).then(() => {
        animateScale(button.container, 1, 100);
      });
    });
    
    row.addChild(button.container);
    currentX += button.width + MATERIAL_SPACING[4];
  });
  
  return row;
}

