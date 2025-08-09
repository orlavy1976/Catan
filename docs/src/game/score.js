// docs/src/game/score.js

export const WIN_POINTS = 10;

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

/* ---------------- Longest Road ---------------- */
function resolveLongestRoad(state) {
  const ownerCand =
    state.longestRoad?.ownerIdx ??
    state.longestRoad?.playerIdx ??
    state.longestRoadOwner ??
    state.longestRoadHolder ??
    state.longestRoad?.owner;

  const lenCand =
    state.longestRoad?.length ??
    state.longestRoad?.len ??
    state.longestRoadLen ??
    null;

  if (!Number.isInteger(ownerCand) || ownerCand < 0) {
    return { ownerIdx: null, length: lenCand ?? null };
  }
  if (Number.isInteger(lenCand)) {
    if (lenCand >= 5) return { ownerIdx: ownerCand, length: lenCand };
    return { ownerIdx: null, length: lenCand };
  }
  return { ownerIdx: ownerCand, length: null };
}

/* ---------------- Largest Army ---------------- */
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
