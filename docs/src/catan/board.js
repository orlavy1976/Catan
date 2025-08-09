// docs/src/catan/board.js
import { standardAxials } from "../utils/geom.js";

// מחולל לוח: רנדומליות מלאה של סוגי האריחים והטוקנים,
// עם ולידציה: אין 6/8 צמודים (על אריחים סמוכים).
export function generateBoard(rng = Math) {
  // כמות אריחים במשחק הבסיס
  const resourceBag = [
    "sheep","sheep","sheep","sheep",
    "wood","wood","wood","wood",
    "wheat","wheat","wheat","wheat",
    "brick","brick","brick",
    "ore","ore","ore",
    "desert",
  ];

  // הטוקנים (ללא 7 — המדבר יקבל 7 תמיד)
  const tokensBagBase = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,3,11];

  // ערבוב משאבים
  shuffleInPlace(resourceBag, rng);

  // נכין שכנויות לפי סדר האריחים המצויר (standardAxials)
  const axials = standardAxials(); // 19 קואורדינטות
  const neighbors = buildNeighbors(axials); // Array<Set<idx>>

  // אינדקסים של משבצות לא-מדבר (לשיבוץ טוקנים)
  const nonDesertIdx = resourceBag
    .map((kind, i) => ({ kind, i }))
    .filter(x => x.kind !== "desert")
    .map(x => x.i);

  // ננסה לשבץ טוקנים עד שאין 6/8 שכנים
  const maxAttempts = 10000;
  let tokensAssignment = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tokens = [...tokensBagBase];
    shuffleInPlace(tokens, rng);

    // ממפים טוקנים לפי אינדקס אריח (רק לא-מדבר)
    const byIndex = new Array(resourceBag.length).fill(7); // 7 למדבר, יוחלף למטה
    let t = 0;
    for (const idx of nonDesertIdx) {
      byIndex[idx] = tokens[t++];
    }
    // ולידציה: אין 6/8 צמודים
    if (noHotAdjacency(byIndex, resourceBag, neighbors)) {
      tokensAssignment = byIndex;
      break;
    }
  }

  // אם לא הצלחנו (נדיר מאוד) — נ fallback פשוט:
  if (!tokensAssignment) {
    const tokens = [...tokensBagBase];
    // נסדר חמים ושאינם חמים, ונמקם "חמים" (6/8) באינדקסים עם שכנים מועטים
    const hot = tokens.filter(x => x === 6 || x === 8);
    const cold = tokens.filter(x => x !== 6 && x !== 8);

    // יעדיף מיקומים עם דרגת שכנות נמוכה
    const candidates = nonDesertIdx
      .map(i => ({ i, deg: neighbors[i].size }))
      .sort((a,b) => a.deg - b.deg)
      .map(x => x.i);

    const byIndex = new Array(resourceBag.length).fill(7);
    // שים חמים קודם על המקומות ה"בודדים" יותר
    let p = 0;
    hot.forEach(tok => { byIndex[candidates[p++]] = tok; });
    // שים את השאר
    cold.forEach(tok => { byIndex[candidates[p++]] = tok; });

    tokensAssignment = byIndex;
  }

  // הפקת תוצר סופי
  const out = [];
  for (let i = 0; i < resourceBag.length; i++) {
    const kind = resourceBag[i];
    const token = (kind === "desert") ? 7 : tokensAssignment[i];
    out.push({ kind, token });
  }
  return out;
}

// צבעי מילוי ברירת מחדל (אם אין טקסטורות)
export function colorFor(kind) {
  return ({
    water:  0x5aa0c8,
    desert: 0xd8c38e,
    wood:   0x256d39,
    sheep:  0x7bbf6a,
    wheat:  0xd8b847,
    brick:  0xb04a3a,
    ore:    0x6a6f7b,
  })[kind];
}

/* ------------ helpers ------------- */

// בונה שכנויות לפי קואורדינטות axial
function buildNeighbors(axials) {
  const key = (a) => `${a.q},${a.r}`;
  const set = new Map();
  axials.forEach((a, i) => set.set(key(a), i));

  const DIRS = [
    { q:+1, r:0 }, { q:+1, r:-1 }, { q:0, r:-1 },
    { q:-1, r:0 }, { q:-1, r:+1 }, { q:0, r:+1 },
  ];

  const neighbors = axials.map(() => new Set());
  axials.forEach((a, i) => {
    DIRS.forEach(d => {
      const nb = { q: a.q + d.q, r: a.r + d.r };
      const j = set.get(key(nb));
      if (j != null) {
        neighbors[i].add(j);
      }
    });
  });
  return neighbors;
}

function noHotAdjacency(tokensByIndex, resources, neighbors) {
  const isHot = (t) => t === 6 || t === 8;
  for (let i = 0; i < resources.length; i++) {
    if (resources[i] === "desert") continue;
    if (!isHot(tokensByIndex[i])) continue;
    for (const j of neighbors[i]) {
      if (resources[j] === "desert") continue;
      if (isHot(tokensByIndex[j])) return false;
    }
  }
  return true;
}

function shuffleInPlace(arr, rng = Math) {
  const rand = rng.random ? () => rng.random() : Math.random;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
