// docs/src/catan/board.js

// מפה קבועה (MVP)
export function generateBoard() {
  const tiles = [
    "brick","wood","sheep","wheat","ore",
    "sheep","wood","wheat","brick","sheep",
    "ore","wheat","desert","wood","sheep",
    "wheat","wood","ore","brick"
  ];
  const tokens = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,3,11];

  const withTokens = [];
  let t = 0;
  for (let i = 0; i < tiles.length; i++) {
    const kind = tiles[i];
    const token = kind === "desert" ? 7 : tokens[t++];
    withTokens.push({ kind, token });
  }
  return withTokens;
}

export function colorFor(kind) {
  return ({
    water: 0x5aa0c8,
    desert: 0xd8c38e,
    wood:   0x256d39,
    sheep:  0x7bbf6a,
    wheat:  0xd8b847,
    brick:  0xb04a3a,
    ore:    0x6a6f7b,
  })[kind];
}

/**
 * רצף הנמלים לפי ההיקף (clockwise / CCW לא קריטי — ניישר ב-initBoard).
 * כאן מגדירים רק את ה"טיפוס": 4×"any" + 5×משאב.
 * posIndices: האינדקסים של צלעות החוף (נגד-השעון) שעליהם יישבו הנמלים.
 * נוכל לכייל את המספרים בקלות באמצעות דיבאגר המספור.
 */
export function standardPortsByCoastIndex() {
  // סדר טיפוסים: (אפשר לשנות, זה רק ברירת מחדל של הבסיס)
  const types = [
    { ratio: 3, type: "any" },
    { ratio: 2, type: "wood" },
    { ratio: 3, type: "any" },
    { ratio: 2, type: "wheat" },
    { ratio: 3, type: "any" },
    { ratio: 2, type: "sheep" },
    { ratio: 3, type: "any" },
    { ratio: 2, type: "ore" },
    { ratio: 2, type: "brick" },
  ];

  // מיפוי לאינדקסי חוף—ערכים התחלתיים (יעבדו טוב עם הפריסה הסטנדרטית).
  // אם תרצה 100% התאמה לקופסה המקורית, נעדכן אחרי בדיקת הדיבאגר.
  const posIndices = [3, 5, 8, 10, 14, 18, 20, 24, 27];

  return { types, posIndices };
}
