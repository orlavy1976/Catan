// docs/src/game/devcards.js

// חפיסת בסיס: 25 קלפים
// Knight×14, Victory Point×5, Year of Plenty×2, Monopoly×2, Road Building×2
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
    // Fisher–Yates
    for (let i = deck.length - 1; i > 0; i--) {
      const j = (rng.random ? rng.random() : rng.random) ? Math.floor(rng.random() * (i + 1)) : Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    state.devDeck = deck;
  }
  // ודא שלכל שחקן יש מפת dev
  state.players.forEach(p => {
    if (!p.dev) {
      p.dev = { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
    }
  });
}

const COST = { ore:1, wheat:1, sheep:1 };

function canPay(res, cost) {
  return Object.keys(cost).every(k => (res[k] || 0) >= cost[k]);
}
function pay(res, cost) {
  for (const k in cost) res[k] -= cost[k];
}

export function startBuyDevCard({ app, hud, state, resPanel }) {
  if (state.phase !== "play") {
    hud.showResult("You can only buy a development card on your turn.");
    return;
  }
  initDevDeck(state);

  const me = state.players[state.currentPlayer - 1];
  if (!canPay(me.resources, COST)) {
    hud.showResult("Need 1 ore, 1 wheat, 1 sheep to buy a development card.");
    return;
  }
  if (!state.devDeck || state.devDeck.length === 0) {
    hud.showResult("Development deck is empty.");
    return;
  }

  // גביית עלות + שליפת קלף
  pay(me.resources, COST);
  const card = state.devDeck.pop();

  if (!me.dev) me.dev = { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
  me.dev[card] = (me.dev[card] || 0) + 1;

  resPanel?.updateResources?.(state.players);

  // מסר: לא חושפים סוג, רק "קנית קלף" (לפי החוקים). במצב DEBUG אפשר לחשוף.
  const DEBUG_REVEAL = false;
  hud.showResult(DEBUG_REVEAL ? `Bought Development: ${pretty(card)}` : "Bought a development card.");

  // בעתיד: נוסיף startPlayDev() לפתיחה של דיאלוג הפעלה.
}

function pretty(k) {
  return ({
    knight: "Knight",
    vp: "Victory Point",
    year_of_plenty: "Year of Plenty",
    monopoly: "Monopoly",
    road_building: "Road Building",
  })[k] || k;
}
