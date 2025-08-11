// Development cards: Modern modular system using Material Design
// Unified development card management with proper state handling

import { patch } from "./stateStore.js";
import { 
  createMaterialAlert
} from "../utils/materialDialog.js";

// Modular imports
import { 
  initDevDeck, 
  startBuyDevCard 
} from "./devcards/purchase.js";
import { 
  showMaterialPlayDevCardDialog 
} from "./dialogs/materialDevcards.js";

// Re-export for backward compatibility
export { initDevDeck, startBuyDevCard };

import { patch } from "./stateStore.js";

export function initDevDeck(state, rng = Math) {
  if (!state.devDeck || !Array.isArray(state.devDeck) || state.devDeck.length === 0) {
    const deck = [...DECK_DEF];
    // Fisher–Yates
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor((rng.random ? rng.random() : Math.random()) * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    state.devDeck = deck;
  }
  // ודא לכל שחקן מפת dev + devNew (קלפים שנקנו בתור הנוכחי)
  state.players.forEach(p => {
    p.dev ??= { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
    p.devNew ??= { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
    p.knightsPlayed ??= 0; // לשימוש ל-Largest Army
  });
}

const COST = { ore:1, wheat:1, sheep:1 };

function canPay(res, cost){ return Object.keys(cost).every(k => (res[k] || 0) >= cost[k]); }
function pay(res, cost){ for (const k in cost) res[k] -= cost[k]; }

export function startBuyDevCard({ app, hud, state, resPanel }) {
  if (state.phase !== "play") { hud.showResult("You can only buy a development card on your turn."); return; }
  initDevDeck(state);

  const me = state.players[state.currentPlayer - 1];
  if (!canPay(me.resources, COST)) { hud.showResult("Need 1 ore, 1 wheat, 1 sheep."); return; }
  if (!state.devDeck?.length) { hud.showResult("Development deck is empty."); return; }

  pay(me.resources, COST);
  const card = state.devDeck.pop();

  // עדכון יד
  me.dev[card] = (me.dev[card] || 0) + 1;
  me.devNew[card] = (me.devNew[card] || 0) + 1; // מסמן “נקנה בתור הזה”

  resPanel?.updateResources?.(state.players);
  showDevReveal({ app, card, onClose: () => hud.showResult(`You received: ${pretty(card)}`) });
}

/* =========================
   PLAY DEV – main entry (Material Design)
   ========================= */
export function startPlayDev(deps) {
  showMaterialPlayDevCardDialog(deps);
}

/* =========================
   LEGACY FUNCTIONS - To be removed
   These are kept temporarily for backward compatibility
   All functionality has been moved to modular files
   ========================= */

// DEPRECATED: Use the Material Design visual components instead
export function drawDevCardFace(cardKey) {
  console.warn('drawDevCardFace is deprecated. Use createDevCardFace from devcards/visual.js');
  
  // Temporary fallback to old implementation
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0xfef3c7).drawRoundedRect(0, 0, 96, 130, 10).endFill();
  g.lineStyle(2, 0x111827, 0.6).drawRoundedRect(0, 0, 96, 130, 10);
  c.addChild(g);

  const icon = new PIXI.Graphics(); 
  icon.x = 48; 
  icon.y = 46;
  
  switch (cardKey) {
    case "knight": 
      icon.lineStyle(3, 0x1f2937, 1); 
      icon.moveTo(-18, -18).lineTo(18, 18); 
      icon.moveTo(-10, -6).lineTo(-2, 2); 
      icon.moveTo(6, 10).lineTo(12, 16); 
      break;
    case "road_building": 
      icon.lineStyle(3, 0x1f2937, 1); 
      icon.moveTo(-24, 0).lineTo(24, 0); 
      icon.moveTo(-24, -8).lineTo(0, -8); 
      icon.moveTo(4, -8).lineTo(24, -8); 
      break;
    case "year_of_plenty": 
      icon.beginFill(0x1f2937, 1).drawPolygon([-18, 10, 0, -16, 18, 10]).endFill(); 
      break;
    case "monopoly": 
      icon.lineStyle(3, 0x1f2937, 1).drawCircle(0, 0, 20); 
      break;
    case "vp": 
      icon.beginFill(0x1f2937, 1).drawPolygon([-18, 8, -10, -12, 0, 8, 10, -12, 18, 8]).endFill(); 
      break;
  }
  c.addChild(icon);

  const t = new PIXI.Text(shortKey(cardKey), { 
    fontFamily: "Arial", 
    fontSize: 12, 
    fill: 0x111827 
  });
  t.anchor.set(0.5, 0); 
  t.x = 48; 
  t.y = 92; 
  c.addChild(t);
  
  return c;
}

// DEPRECATED: Helper functions for backward compatibility
function shortKey(k) {
  return ({ 
    knight: "Knight", 
    vp: "Victory", 
    year_of_plenty: "Year of Plenty", 
    monopoly: "Monopoly", 
    road_building: "Road Building" 
  })[k] || k;
}

function pretty(k) {
  return ({ 
    knight: "Knight", 
    vp: "Victory Point", 
    year_of_plenty: "Year of Plenty", 
    monopoly: "Monopoly", 
    road_building: "Road Building" 
  })[k] || k;
}

function prettyDesc(k) {
  return ({
    knight: "Move the robber and steal 1 resource.",
    vp: "Keep hidden. Worth 1 victory point.",
    year_of_plenty: "Take any 2 resources from the bank.",
    monopoly: "Choose a resource; all players give you that resource.",
    road_building: "Build 2 roads for free.",
  })[k] || "";
}


