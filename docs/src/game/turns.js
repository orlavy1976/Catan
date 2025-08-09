export function makeEndTurn(state){
  return function endTurn() {
    state.currentPlayer++;
    if (state.currentPlayer > state.players.length) {
      state.currentPlayer = 1;
      state.turn++;
    }
  };
}

export function currentPlayer(state){
  return state.players[state.currentPlayer - 1];
}
