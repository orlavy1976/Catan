// גדלים/קבועים שמשרתים את כל המודולים
export const TILE_SIZE = 80;

// משאבים
export const RES_KEYS = ["brick","wood","wheat","sheep","ore"];

// צבעי שחקנים (בהתאם למה שהיה אצלך בבילדר)
export const PLAYER_COLORS = [
  0xd32f2f, // אדום
  0x1976d2, // כחול
  0xffa000, // כתום
  0x388e3c, // ירוק
];

export const BUILD_COSTS = {
  road: { brick: 1, wood: 1 },
  settlement: { brick: 1, wood: 1, wheat: 1, sheep: 1 }, // לשלב הבא
  city: { wheat: 2, ore: 3 }, // לשלב הבא
};

