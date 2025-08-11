// Development card deck initialization
const DECK_DEF = [
  ...Array(14).fill("knight"),
  ...Array(5).fill("vp"),
  ...Array(2).fill("year_of_plenty"),
  ...Array(2).fill("monopoly"),
  ...Array(2).fill("road_building"),
];

export function initDevDeck(state, rng = Math) {
  if (!state.devDeck || !Array.isArray(state.devDeck) || state.devDeck.length === 0) {
    const deck = [...DECK_DEF];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor((rng.random ? rng.random() : Math.random()) * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    state.devDeck = deck;
  }
  state.players.forEach(p => {
    p.dev ??= { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
    p.devNew ??= { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
    p.knightsPlayed ??= 0;
  });
}

