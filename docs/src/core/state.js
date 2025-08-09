export const state = {
  turn: 1,
  currentPlayer: 1,
  lastRoll: null,

  players: [
    { id: 1, colorIdx: 0, settlements: [], roads: [] },
    { id: 2, colorIdx: 1, settlements: [], roads: [] },
    { id: 3, colorIdx: 2, settlements: [], roads: [] },
    { id: 4, colorIdx: 3, settlements: [], roads: [] },
  ],

  setup: {
    round: 1,           // 1: forward, 2: reverse
    placing: "settlement", // "settlement" -> "road"
    lastSettlementVertex: null,
  },
};
