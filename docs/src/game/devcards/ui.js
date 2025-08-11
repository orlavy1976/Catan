// docs/src/game/devcards/ui.js
// 🎨 Development Card UI Components - Material Design
// Modern visual components for development cards

import { 
  createDevCardFace,
  createDevCardCounter,
  createDevCardCollection
} from "./visual.js";
import { createMaterialButton } from "../../catan/ui/materialButton.js";

// Re-export the new Material Design components
export { 
  createDevCardCounter,
  createDevCardCollection
};

// Backward compatibility - use Material Design version
export function drawDevCardFace(cardKey) {
  console.warn('drawDevCardFace is deprecated. Use createDevCardFace from visual.js');
  return createDevCardFace(cardKey);
}

// Backward compatibility for legacy button functions
export function makeBigButton(text, onClick) {
  console.warn('makeBigButton is deprecated. Use createMaterialButton instead');
  const button = createMaterialButton(text, {
    variant: 'filled',
    size: 'large'
  });
  if (onClick) {
    button.onClick(onClick);
  }
  return button;
}

export function makeChip(text, onClick) {
  console.warn('makeChip is deprecated. Use createMaterialButton instead');
  const button = createMaterialButton(text, {
    variant: 'outlined',
    size: 'small'
  });
  if (onClick) {
    button.onClick(onClick);
  }
  return button;
}

// Helper functions
function shortKey(k) {
  return ({ 
    knight: "Knight", 
    vp: "Victory", 
    year_of_plenty: "Year of Plenty", 
    monopoly: "Monopoly", 
    road_building: "Road Building" 
  })[k] || k;
}

export function pretty(k) {
  return ({ 
    knight: "Knight", 
    vp: "Victory Point", 
    year_of_plenty: "Year of Plenty", 
    monopoly: "Monopoly", 
    road_building: "Road Building" 
  })[k] || k;
}

export function prettyDesc(k) {
  return ({
    knight: "Move the robber and steal 1 resource.",
    vp: "Keep hidden. Worth 1 victory point.",
    year_of_plenty: "Take any 2 resources from the bank.",
    monopoly: "Choose a resource; all players give you that resource.",
    road_building: "Build 2 roads for free.",
  })[k] || "";
}
