import { makeResIcon } from "./icon.js";
import { makeDevCardIcon } from "./devCardIcon.js";
import { 
  MATERIAL_COLORS,
  MATERIAL_SPACING
} from "../../config/materialDesign.js";
import { PLAYER_COLORS } from "../../config/constants.js";
import { 
  createMaterialRow
} from "../../utils/materialPanel.js";

const RES_ORDER = ["brick","wood","wheat","sheep","ore"];

export function makePlayerRow(player) {
  // Create the base Material Design row
  const materialRow = createMaterialRow({
    text: `P${player.id}`,
    secondaryText: "", // Will be updated with resource counts
    color: PLAYER_COLORS[player.colorIdx ?? 0],
    showBadge: true,
    height: 60 // Taller row to accommodate resource icons
  });

  const container = materialRow.container;
  
  // Resource icons with improved positioning
  const resourceIcons = [];
  const counters = {}; 
  
  RES_ORDER.forEach((k, idx) => {
    const cell = makeResIcon(k);
    container.addChild(cell.container);
    resourceIcons.push(cell);
    counters[k] = cell.setCount;
  });

  // Development card icon
  const devCardIcon = makeDevCardIcon();
  container.addChild(devCardIcon.container);
  counters.devCards = devCardIcon.setCount;

  // Position resource icons with Material Design spacing
  const iconStartX = 80; // Fixed start position after player name area
  const iconSpacing = 40; // Adjusted spacing for smaller icons
  
  resourceIcons.forEach((icon, idx) => {
    icon.container.x = iconStartX + (idx * iconSpacing);
    icon.container.y = 10; // Center in 60px row
  });

  // Position development card icon after resource icons
  devCardIcon.container.x = iconStartX + (5 * iconSpacing) + MATERIAL_SPACING[2];
  devCardIcon.container.y = 10; // Slightly higher for different icon size

  // Track resource counts for secondary text
  const resourceCounts = {};
  let devCardCount = 0;
  
  // Initialize resource counts
  RES_ORDER.forEach(k => {
    resourceCounts[k] = 0;
  });

  function setResource(kind, count) {
    counters[kind]?.(count);
    resourceCounts[kind] = count;
    updateSecondaryText();
  }

  function setDevCards(count) {
    counters.devCards?.(count);
    devCardCount = count;
    updateSecondaryText();
  }
  
  function setActive(active) {
    materialRow.setActive(active);
  }

  function updateSecondaryText() {
    // Create a summary text showing total resources
    const totalResources = Object.values(resourceCounts).reduce((sum, count) => sum + (count || 0), 0);
    const summary = `${totalResources} resources, ${devCardCount} dev cards`;
    materialRow.setSecondaryText(summary);
  }

  // Custom resize function that also handles icon positioning
  function resize(width) {
    materialRow.resize(width);
    
    // Adjust icon spacing based on available width
    const availableWidth = width - iconStartX - 60; // Leave space for dev card
    const adjustedSpacing = Math.min(40, availableWidth / 5);
    
    resourceIcons.forEach((icon, idx) => {
      icon.container.x = iconStartX + (idx * adjustedSpacing);
    });
    
    devCardIcon.container.x = iconStartX + (5 * adjustedSpacing) + MATERIAL_SPACING[2];
  }

  // Initialize secondary text
  updateSecondaryText();

  return { 
    container, 
    setResource, 
    setDevCards, 
    setActive,
    resize: resize
  };
}
