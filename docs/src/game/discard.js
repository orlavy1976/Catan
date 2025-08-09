import { RES_KEYS } from "../config/constants.js";
import { patch } from "./stateStore.js";

/**
 * Discard phase after rolling 7.
 * - All players with >7 cards discard floor(total/2)
 * - For now: automatic, random-weighted by current counts.
 * - Shows a summary via HUD and updates the Resource Panel.
 */
export function enterDiscardPhase({ hud, state, resPanel }, onDone) {
  const offenders = [];
  state.players.forEach((p, idx) => {
    const total = totalCards(p.resources);
    if (total > 7) offenders.push({ idx, need: Math.floor(total / 2) });
  });

  if (offenders.length === 0) {
    onDone?.();
    return;
  }

  const summaries = [];

  offenders.forEach(({ idx, need }) => {
    if (need <= 0) return;
    const before = { ...state.players[idx].resources };
    autoDiscard(state.players[idx].resources, need);
    const after = state.players[idx].resources;
    const diff = RES_KEYS
      .map(k => {
        const d = (before[k] || 0) - (after[k] || 0);
        return d > 0 ? `${d} ${k}` : null;
      })
      .filter(Boolean);
    if (diff.length) summaries.push(`P${idx + 1}: ${diff.join(", ")}`);
  });

  // 👈 עדכון מיידי של הפאנל (תיקון הבאג)
  resPanel?.updateResources?.(state.players);

  if (summaries.length) {
    hud.showResult("Discard — " + summaries.join(" | "));
  } else {
    hud.showResult("Discard — no one had to.");
  }
  onDone?.();
}

function autoDiscard(resources, count) {
  // Weighted random by available cards
  for (let i = 0; i < count; i++) {
    const bag = [];
    for (const k of RES_KEYS) {
      for (let n = 0; n < (resources[k] || 0); n++) bag.push(k);
    }
    if (bag.length === 0) break;
    const pick = bag[Math.floor(Math.random() * bag.length)];
    resources[pick] = (resources[pick] || 0) - 1;
  }
}

function totalCards(res) {
  let t = 0;
  for (const k of RES_KEYS) t += res[k] || 0;
  return t;
}
