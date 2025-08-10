import { 
  DIMENSIONS, 
  COLORS,
  getResourceColor 
} from "../../config/design.js";
import { 
  createStyledText 
} from "../../utils/ui.js";

const RES_LABELS = {
  brick: "Brick",
  wood:  "Wood", 
  wheat: "Wheat",
  sheep: "Sheep",
  ore:   "Ore",
};

export function makeResIcon(kind) {
  const container = new PIXI.Container();

  // Icon background - using design system
  const icon = new PIXI.Graphics();
  icon.beginFill(getResourceColor(kind), 0.95);
  icon.drawRoundedRect(
    0, 0, 
    DIMENSIONS.resourceIcon.width, 
    DIMENSIONS.resourceIcon.height, 
    DIMENSIONS.borderRadius.small
  );
  icon.endFill();
  icon.lineStyle({ width: 1, color: COLORS.background.secondary, alpha: 0.25 });
  icon.drawRoundedRect(
    0, 0, 
    DIMENSIONS.resourceIcon.width, 
    DIMENSIONS.resourceIcon.height, 
    DIMENSIONS.borderRadius.small
  );
  container.addChild(icon);

  // Resource letter - using design system
  const letter = createStyledText(
    (RES_LABELS[kind] ?? "?")[0], 
    'bodySmall', 
    { 
      fill: 0x101010,
      stroke: 0xffffff,
      strokeThickness: 2 
    }
  );
  letter.anchor.set(0.5, 0.5);
  letter.x = DIMENSIONS.resourceIcon.width / 2; 
  letter.y = DIMENSIONS.resourceIcon.height / 2;
  container.addChild(letter);

  // Resource count - using design system
  const countText = createStyledText("0", 'counter');
  countText.x = DIMENSIONS.resourceIcon.width + 4; 
  countText.y = 0;
  container.addChild(countText);

  function setCount(n) {
    countText.text = String(n ?? 0);
  }

  return { container, setCount };
}
