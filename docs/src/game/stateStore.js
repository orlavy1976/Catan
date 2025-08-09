// Event-bus קטן סביב state קיים: getState / patch / subscribe
import { state as _state } from "../core/state.js";

const listeners = new Set();

/** קבלת state החי (by reference) */
export function getState() { return _state; }

/** עדכון מרוכז: mutator מקבל את ה-state החי ומעדכן אותו */
export function patch(mutator) {
  mutator(_state);
  // פייר לכל המנויים
  for (const fn of listeners) fn(_state);
}

/** מנוי לשינויים; מחזיר unsubscribe */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
