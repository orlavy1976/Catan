// גדלים/קבועים שמשרתים את כל המודולים
import { getPlayerColor, PLAYER_COLORS } from "./materialDesign.js";

export const TILE_SIZE = 80;

// משאבים
export const RES_KEYS = ["brick","wood","wheat","sheep","ore"];

// צבעי שחקנים (exported from materialDesign.js)
export { PLAYER_COLORS };
export const PLAYER_COLORS = [
  getPlayerColor(0), // אדום
  getPlayerColor(1), // כחול
  getPlayerColor(2), // כתום
  getPlayerColor(3), // ירוק
];

export const BUILD_COSTS = {
  road: { brick: 1, wood: 1 },
  settlement: { brick: 1, wood: 1, wheat: 1, sheep: 1 }, // לשלב הבא
  city: { wheat: 2, ore: 3 }, // לשלב הבא
};

