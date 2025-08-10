import { makeResIcon } from "./icon.js";
import { makeDevCardIcon } from "./devCardIcon.js";
import { 
  MATERIAL_COLORS,
  MATERIAL_SPACING
} from "../../config/materialDesign.js";
import { PLAYER_COLORS } from "../../config/constants.js";
import { 
  createMaterialText
} from "../../utils/materialUI.js";

const RES_ORDER = ["brick","wood","wheat","sheep","ore"];

export function makePlayerRow(player) {
  const container = new PIXI.Container();
  
  // Calculate row width with Material Design spacing
  const rowWidth = 80 + (5 * 52) + 50 + MATERIAL_SPACING[3]; // More generous spacing

  // Row background/highlight - Material Design state layer
  const highlight = new PIXI.Graphics();
  highlight.beginFill(MATERIAL_COLORS.primary[500], 0.08); // Material state layer
  highlight.drawRoundedRect(0, 0, rowWidth, 48, 8); // Material Design corner radius
  highlight.endFill();
  highlight.alpha = 0;
  container.addChild(highlight);

  // Player color badge - Material Design
  const badge = new PIXI.Graphics();
  badge.beginFill(PLAYER_COLORS[player.colorIdx ?? 0], 1);
  badge.drawCircle(0, 0, 8); // Material Design size
  badge.endFill();
  badge.x = MATERIAL_SPACING[4]; // 16px from edge
  badge.y = 24; // Center vertically in 48px row
  container.addChild(badge);

  // Player name - Material Design typography
  const nameText = createMaterialText(`P${player.id}`, 'labelLarge');
  nameText.style.fill = MATERIAL_COLORS.neutral[100]; // Light text
  nameText.x = MATERIAL_SPACING[4] + 8 + MATERIAL_SPACING[2]; // Badge + radius + gap
  nameText.y = MATERIAL_SPACING[2]; // Consistent with Material spacing
  container.addChild(nameText);

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
  const iconSpacing = 52; // Material Design touch target size
  
  resourceIcons.forEach((icon, idx) => {
    icon.container.x = iconStartX + (idx * iconSpacing);
    icon.container.y = 12; // Center in 48px row (48-24)/2 = 12
  });

  // Position development card icon after resource icons
  devCardIcon.container.x = iconStartX + (5 * iconSpacing) + MATERIAL_SPACING[2];
  devCardIcon.container.y = 8; // Slightly higher for different icon size

  function setResource(kind, count) {
    counters[kind]?.(count);
  }

  function setDevCards(count) {
    counters.devCards?.(count);
  }
  
  function setActive(active) {
    highlight.alpha = active ? 1 : 0; // Full state layer when active
  }

  return { container, setResource, setDevCards, setActive };
}
