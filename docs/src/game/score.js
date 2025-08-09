// docs/src/game/score.js

/** מחשב ניקוד לכל שחקן + מחזיקי הבונוסים. */
export function computeScores(state) {
  const n = state.players.length;
  const lrOwner = getLongestRoadOwner(state);    // 0-based או null
  const laOwner = getLargestArmyOwner(state);    // 0-based או null

  const scores = [];
  for (let i = 0; i < n; i++) {
    const p = state.players[i] || {};
    const settlements = (p.settlements?.length || 0);
    const cities = (p.cities?.length || 0);
    const devVP = (p.dev?.vp || 0);
    let total = settlements * 1 + cities * 2 + devVP;
    if (lrOwner === i) total += 2;
    if (laOwner === i) total += 2;

    scores.push({
      playerIdx: i,
      settlements,
      cities,
      devVP,
      hasLongestRoad: lrOwner === i,
      hasLargestArmy: laOwner === i,
      total,
    });
  }
  return { scores, lrOwner, laOwner };
}

/** נסיון גמיש לקרוא בעל ה-Longest Road מה־state (כבר קיים אצלך). */
export function getLongestRoadOwner(state) {
  // בודק כמה שדות אפשריים בצורה סלחנית:
  const cand = state.longestRoad?.ownerIdx ?? state.longestRoad?.playerIdx ??
               state.longestRoadOwner ?? state.longestRoadHolder ??
               state.longestRoad?.owner;
  return (Number.isInteger(cand) && cand >= 0) ? cand : null;
}

/** Largest Army מחושב דינמית לפי knightsPlayed (מינימום 3 ויתרון מובהק). */
export function getLargestArmyOwner(state) {
  const ks = state.players.map(p => p?.knightsPlayed || 0);
  let bestIdx = null, bestVal = -1, tie = false;
  for (let i = 0; i < ks.length; i++) {
    const v = ks[i];
    if (v > bestVal) { bestVal = v; bestIdx = i; tie = false; }
    else if (v === bestVal) { tie = true; }
  }
  if (bestVal >= 3 && !tie) return bestIdx;
  return null;
}
