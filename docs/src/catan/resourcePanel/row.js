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


function createLongestRoadIcon() {
  const container = new PIXI.Container();
  const bg = new PIXI.Graphics();
  bg.beginFill(MATERIAL_COLORS.semantic.warning); // Golden color
  bg.drawRoundedRect(0, 0, 24, 36, 4);
  bg.endFill();
  container.addChild(bg);
  const crown = new PIXI.Text("👑", { fontSize: 14, fill: MATERIAL_COLORS.neutral[0] });
  crown.anchor.set(0.5);
  crown.x = 12;
  crown.y = 10;
  container.addChild(crown);
  container.visible = false;
  return { container };
}

function createLargestArmyIcon() {
  const container = new PIXI.Container();
  const bg = new PIXI.Graphics();
  bg.beginFill(MATERIAL_COLORS.semantic.info); // Blue shield
  bg.drawRoundedRect(0, 0, 24, 36, 4);
  bg.endFill();
  container.addChild(bg);
  // Shield emoji (or swords if you prefer)
  const shield = new PIXI.Text("🛡️", { fontSize: 15, fill: MATERIAL_COLORS.neutral[0] });
  shield.anchor.set(0.5);
  shield.x = 12;
  shield.y = 10;
  container.addChild(shield);
  container.visible = false;
  return { container };
}

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

  // Longest Road indicator (crown icon)
  const longestRoadIcon = createLongestRoadIcon();
  container.addChild(longestRoadIcon.container);
  // Largest Army indicator (shield icon)
  const largestArmyIcon = createLargestArmyIcon();
  container.addChild(largestArmyIcon.container);

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

  // Position longest road icon after dev card icon
  longestRoadIcon.container.x = iconStartX + (5 * iconSpacing) + MATERIAL_SPACING[2] + 50;
  longestRoadIcon.container.y = 10; // Center vertically
  // Position largest army icon after longest road icon
  largestArmyIcon.container.x = iconStartX + (5 * iconSpacing) + MATERIAL_SPACING[2] + 90;
  largestArmyIcon.container.y = 10;

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


  function setLongestRoad(hasLongestRoad) {
    longestRoadIcon.container.visible = hasLongestRoad;
  }
  function setLargestArmy(hasLargestArmy) {
    largestArmyIcon.container.visible = hasLargestArmy;
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
    const availableWidth = width - iconStartX - 120; // Leave space for dev card and longest road
    const adjustedSpacing = Math.min(40, availableWidth / 5);
    
    resourceIcons.forEach((icon, idx) => {
      icon.container.x = iconStartX + (idx * adjustedSpacing);
    });
    
    devCardIcon.container.x = iconStartX + (5 * adjustedSpacing) + MATERIAL_SPACING[2];
    longestRoadIcon.container.x = iconStartX + (5 * adjustedSpacing) + MATERIAL_SPACING[2] + 50;
  }

  // Initialize secondary text
  updateSecondaryText();

  return { 
    container, 
    setResource, 
    setDevCards, 
    setActive,
    setLongestRoad,
    setLargestArmy,
    resize: resize
  };
}
