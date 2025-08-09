export const selectCurrentPlayer = (state) =>
  state.players[state.currentPlayer - 1];

export const selectOwnerByVertex = (state) => {
  const map = new Map();
  state.players.forEach((p, idx) => p.settlements.forEach(vId => map.set(vId, idx)));
  return map;
};
