// פונקציות חוקים בסיסיות שנרחיב בהמשך
export function rollDice() {
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  return { d1, d2, sum: d1 + d2 };
}
