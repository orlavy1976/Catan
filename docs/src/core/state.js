export const state = {
  turn: 1,
  currentPlayer: 1,
  lastRoll: null,

  // אינדקס האריח שבו עומד הרובבר (נאתחל במדבר בזמן בניית הלוח)
  robberTile: null,
  
  // Board layout (tiles and tokens) - will be set during board generation
  boardLayout: null,

  players: [
    { id: 1, colorIdx: 0, settlements: [], roads: [], cities: [], resources: { brick:0, wood:0, wheat:0, sheep:0, ore:0 } },
    { id: 2, colorIdx: 1, settlements: [], roads: [], cities: [], resources: { brick:0, wood:0, wheat:0, sheep:0, ore:0 } },
    { id: 3, colorIdx: 2, settlements: [], roads: [], cities: [], resources: { brick:0, wood:0, wheat:0, sheep:0, ore:0 } },
    { id: 4, colorIdx: 3, settlements: [], roads: [], cities: [], resources: { brick:0, wood:0, wheat:0, sheep:0, ore:0 } },
  ],

  setup: {
    round: 1,                // 1: קדימה, 2: אחורה
    placing: "settlement",   // "settlement" -> "road"
    lastSettlementVertex: null,
  },

  phase: "setup",            // "setup" | "play" | "move-robber"
};
