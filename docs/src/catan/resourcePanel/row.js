import { makeResIcon } from "./icon.js";
import { makeDevCardIcon } from "./devCardIcon.js";
import { 
  DIMENSIONS, 
  SPACING, 
  ALPHA,
  COLORS,
  getPlayerColor 
} from "../../config/design.js";
import { 
  createStyledText,
  arrangeHorizontally 
} from "../../utils/ui.js";

const RES_ORDER = ["brick","wood","wheat","sheep","ore"];

export function makePlayerRow(player) {
  const container = new PIXI.Container();
  
  // Calculate row width to fit all content including dev card icon
  const rowWidth = 70 + (5 * 48) + 40 + 10; // Player name + resource icons + dev card icon + extra padding

  // רקע/היילייט לשורה - using design system
  const highlight = new PIXI.Graphics();
  highlight.beginFill(COLORS.ui.border, ALPHA.minimal);
  highlight.drawRoundedRect(0, 0, rowWidth, 44, DIMENSIONS.borderRadius.base);
  highlight.endFill();
  highlight.alpha = 0;
  container.addChild(highlight);

  // באדג' צבע - using design system
  const badge = new PIXI.Graphics();
  badge.beginFill(getPlayerColor(player.colorIdx ?? 0), 1);
  badge.drawCircle(0, 0, DIMENSIONS.playerBadge.radius);
  badge.endFill();
  badge.x = SPACING.lg; 
  badge.y = 22; // Center vertically
  container.addChild(badge);

  // שם/מזהה - using design system
  const nameText = createStyledText(`P${player.id}`, 'playerName');
  nameText.x = SPACING.lg + DIMENSIONS.playerBadge.radius + SPACING.base; 
  nameText.y = SPACING.sm;
  container.addChild(nameText);

  // תאי משאב - using precise positioning for better alignment
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

  // Position resource icons with consistent spacing
  const iconStartX = 70; // Fixed start position for alignment
  const iconSpacing = 48; // Consistent spacing between icons
  
  resourceIcons.forEach((icon, idx) => {
    icon.container.x = iconStartX + (idx * iconSpacing);
    icon.container.y = 13; // Consistent vertical position
  });

  // Position development card icon after resource icons
  devCardIcon.container.x = iconStartX + (5 * iconSpacing) + 8; // After 5 resource icons with small gap
  devCardIcon.container.y = 6; // Slightly higher to account for different icon size

  function setResource(kind, count) {
    counters[kind]?.(count);
  }

  function setDevCards(count) {
    counters.devCards?.(count);
  }
  
  function setActive(active) {
    highlight.alpha = active ? ALPHA.highlight : 0;
  }

  return { container, setResource, setDevCards, setActive };
}
