import { 
  MATERIAL_COLORS,
  MATERIAL_SPACING
} from "../../config/materialDesign.js";
import { 
  createMaterialText,
  getMaterialResourceColor
} from "../../utils/materialUI.js";

const RES_LABELS = {
  brick: "Brick",
  wood:  "Wood", 
  wheat: "Wheat",
  sheep: "Sheep",
  ore:   "Ore",
};

export function makeResIcon(kind) {
  const container = new PIXI.Container();

  // Icon background - Material Design chip style
  const iconSize = 24; // Material Design icon size
  const icon = new PIXI.Graphics();
  const resourceColor = getMaterialResourceColor(kind);
  
  icon.beginFill(resourceColor, 0.9);
  icon.drawRoundedRect(0, 0, iconSize, iconSize, 6); // Material Design corner radius
  icon.endFill();
  
  // Add subtle border for better definition
  icon.lineStyle({ width: 1, color: MATERIAL_COLORS.neutral[600], alpha: 0.2 });
  icon.drawRoundedRect(0, 0, iconSize, iconSize, 6);
  container.addChild(icon);

  // Resource letter - Material Design typography
  const letter = createMaterialText(
    (RES_LABELS[kind] ?? "?")[0], 
    'labelSmall',
    { 
      fill: MATERIAL_COLORS.neutral[900], // Dark text for contrast
      fontWeight: 'bold'
    }
  );
  letter.anchor.set(0.5, 0.5);
  letter.x = iconSize / 2;
  letter.y = iconSize / 2;
  container.addChild(letter);

  // Count display - Material Design style
  const countText = createMaterialText("0", 'labelMedium');
  countText.style.fill = MATERIAL_COLORS.neutral[100]; // Light text
  countText.anchor.set(0.5, 0);
  countText.x = iconSize / 2;
  countText.y = iconSize + MATERIAL_SPACING[1]; // Small gap below icon
  container.addChild(countText);

  function setCount(n) {
    countText.text = String(n ?? 0);
  }

  return { container, setCount };
}
