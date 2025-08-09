// docs/src/game/score.js

/** מחשב ניקוד לכל שחקן + מחזיקי הבונוסים (LR/LA). */
export function computeScores(state) {
  const n = state.players.length;
  const lr = resolveLongestRoad(state);   // { ownerIdx|null, length|null }
  const la = resolveLargestArmy(state);   // { ownerIdx|null, knights:null|number }

  const scores = [];
  for (let i = 0; i < n; i++) {
    const p = state.players[i] || {};
    const settlements = p.settlements?.length || 0;
    const cities = p.cities?.length || 0;
    const devVP = p.dev?.vp || 0;

    let total = settlements * 1 + cities * 2 + devVP;
    const hasLR = lr.ownerIdx === i;
    const hasLA = la.ownerIdx === i;
    if (hasLR) total += 2;
    if (hasLA) total += 2;

    scores.push({
      playerIdx: i,
      settlements,
      cities,
      devVP,
      hasLongestRoad: hasLR,
      hasLargestArmy: hasLA,
      total,
    });
  }
  return { scores, lrOwner: lr.ownerIdx, laOwner: la.ownerIdx };
}

/* ---------------- Longest Road ----------------
   מנסה לקרוא מבני state שונים בצורה גמישה, ואם יש גם אורך — בודק סף 5.
*/
function resolveLongestRoad(state) {
  // בעלי תפקיד פוטנציאליים
  const ownerCand =
    state.longestRoad?.ownerIdx ??
    state.longestRoad?.playerIdx ??
    state.longestRoadOwner ??
    state.longestRoadHolder ??
    state.longestRoad?.owner;

  // אורך אם זמין
  const lenCand =
    state.longestRoad?.length ??
    state.longestRoad?.len ??
    state.longestRoadLen ??
    null;

  // אם אין בעל תפקיד חוקי — אין בונוס
  if (!Number.isInteger(ownerCand) || ownerCand < 0) {
    return { ownerIdx: null, length: lenCand ?? null };
  }

  // אם יש אורך זמין — דרוש סף 5 לפי החוקים
  if (Number.isInteger(lenCand)) {
    if (lenCand >= 5) return { ownerIdx: ownerCand, length: lenCand };
    // אורך קטן מ-5 ⇒ אין בונוס עדיין
    return { ownerIdx: null, length: lenCand };
  }

  // אין מידע על האורך ⇒ נניח שהלוגיקה החיצונית כבר אוכפת את הסף
  return { ownerIdx: ownerCand, length: null };
}

/* ---------------- Largest Army ----------------
   חישוב דינמי: מי ששיחק הכי הרבה Knights, מינימום 3 וללא תיקו.
*/
function resolveLargestArmy(state) {
  const ks = state.players.map(p => p?.knightsPlayed || 0);
  let bestIdx = null, bestVal = -1, tie = false;
  for (let i = 0; i < ks.length; i++) {
    const v = ks[i];
    if (v > bestVal) { bestVal = v; bestIdx = i; tie = false; }
    else if (v === bestVal) { tie = true; }
  }
  if (bestVal >= 3 && !tie) return { ownerIdx: bestIdx, knights: bestVal };
  return { ownerIdx: null, knights: bestVal };
}
