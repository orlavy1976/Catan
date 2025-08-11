// docs/src/game/devcards/purchase.js
// 🎴 Development Card Purchase Logic
// Clean, modular card purchase system

import { patch } from "../stateStore.js";
import { 
  createMaterialAlert,
  createMaterialConfirm 
} from "../../utils/materialDialog.js";

const DECK_DEF = [
  ...Array(14).fill("knight"),
  ...Array(5).fill("vp"),
  ...Array(2).fill("year_of_plenty"),
  ...Array(2).fill("monopoly"),
  ...Array(2).fill("road_building"),
];

const PURCHASE_COST = { ore: 1, wheat: 1, sheep: 1 };

/**
 * Initialize development card deck
 * @param {object} state - Game state
 * @param {object} rng - Random number generator
 */
export function initDevDeck(state, rng = Math) {
  if (!state.devDeck || !Array.isArray(state.devDeck) || state.devDeck.length === 0) {
    const deck = [...DECK_DEF];
    // Fisher–Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor((rng.random ? rng.random() : Math.random()) * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    state.devDeck = deck;
  }
  
  // Ensure all players have dev card structures
  state.players.forEach(p => {
    p.dev ??= { knight: 0, vp: 0, year_of_plenty: 0, monopoly: 0, road_building: 0 };
    p.devNew ??= { knight: 0, vp: 0, year_of_plenty: 0, monopoly: 0, road_building: 0 };
    p.knightsPlayed ??= 0; // For Largest Army calculation
  });
}

/**
 * Start development card purchase process
 * @param {object} deps - Dependencies
 */
export function startBuyDevCard({ app, hud, state, resPanel, refreshScores }) {
  if (state.phase !== "play") {
    const alert = createMaterialAlert(app, {
      title: "Invalid Action",
      message: "You can only buy a development card on your turn.",
    });
    alert.show();
    return;
  }

  initDevDeck(state);

  const me = state.players[state.currentPlayer - 1];
  
  if (!canAfford(me.resources, PURCHASE_COST)) {
    const alert = createMaterialAlert(app, {
      title: "Insufficient Resources",
      message: "You need 1 ore, 1 wheat, and 1 sheep to buy a development card.",
    });
    alert.show();
    return;
  }
  
  if (!state.devDeck?.length) {
    const alert = createMaterialAlert(app, {
      title: "No Cards Available",
      message: "The development card deck is empty.",
    });
    alert.show();
    return;
  }

  // Show purchase confirmation
  const confirm = createMaterialConfirm(app, {
    title: "Buy Development Card",
    message: "Purchase a random development card for 1 ore, 1 wheat, and 1 sheep?",
    onConfirm: () => {
      executePurchase({ state, resPanel, refreshScores, hud, app });
    }
  });
  
  confirm.show();
}

/**
 * Execute the card purchase
 * @param {object} deps - Dependencies
 */
function executePurchase({ state, resPanel, refreshScores, hud, app }) {
  const me = state.players[state.currentPlayer - 1];
  
  // Pay cost using patch for proper state management
  patch(s => {
    const player = s.players[s.currentPlayer - 1];
    Object.entries(PURCHASE_COST).forEach(([resource, amount]) => {
      player.resources[resource] -= amount;
    });
  });

  // Draw card from deck
  const card = state.devDeck.pop();
  
  // Add card to player using patch
  patch(s => {
    const player = s.players[s.currentPlayer - 1];
    player.dev[card] = (player.dev[card] || 0) + 1;
    player.devNew[card] = (player.devNew[card] || 0) + 1; // Mark as "bought this turn"
  });

  // Update UI
  resPanel?.updateResources?.(state.players);
  refreshScores?.();
  
  // Show card reveal
  showCardReveal({ app, card, hud });
}

/**
 * Show the revealed card after purchase
 * @param {object} deps - Dependencies
 */
function showCardReveal({ app, card, hud }) {
  const cardName = getCardDisplayName(card);
  const cardDesc = getCardDescription(card);
  
  const alert = createMaterialAlert(app, {
    title: "🎉 Card Purchased!",
    message: `You received a ${cardName} card!\n\n${cardDesc}`,
    buttonText: "Great!",
    onClose: () => {
      hud.showResult(`You received: ${cardName}`);
    }
  });
  
  alert.show();
}

/**
 * Check if player can afford a cost
 * @param {object} resources - Player resources
 * @param {object} cost - Cost object
 * @returns {boolean} Can afford
 */
function canAfford(resources, cost) {
  return Object.entries(cost).every(([resource, amount]) => 
    (resources[resource] || 0) >= amount
  );
}

/**
 * Get display name for card type
 * @param {string} type - Card type
 * @returns {string} Display name
 */
function getCardDisplayName(type) {
  const names = {
    knight: 'Knight',
    road_building: 'Road Building',
    year_of_plenty: 'Year of Plenty',
    monopoly: 'Monopoly',
    vp: 'Victory Point'
  };
  return names[type] || type;
}

/**
 * Get description for card type
 * @param {string} type - Card type
 * @returns {string} Description
 */
function getCardDescription(type) {
  const descriptions = {
    knight: 'Move the robber and steal a resource',
    road_building: 'Build 2 roads for free',
    year_of_plenty: 'Take 2 resources from the bank',
    monopoly: 'All players give you their cards of one type',
    vp: 'Keep hidden. Worth 1 victory point.'
  };
  return descriptions[type] || '';
}
