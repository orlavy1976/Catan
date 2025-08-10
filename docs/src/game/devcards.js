// Development cards: buy, reveal, play
// Deck: Knight×14, VP×5, Year of Plenty×2, Monopoly×2, Road Building×2
import { createBigButton, createChip } from "../catan/ui/materialButton.js";
import { 
  showMaterialChoiceDialog, 
  showMaterialConfirmDialog 
} from "../utils/materialDialog.js";
import { 
  showPlayDevCardDialog,
  showMonopolyDialog, 
  showYearOfPlentyDialog 
} from "./dialogs/devcards.js";

const DECK_DEF = [
  ...Array(14).fill("knight"),
  ...Array(5).fill("vp"),
  ...Array(2).fill("year_of_plenty"),
  ...Array(2).fill("monopoly"),
  ...Array(2).fill("road_building"),
];

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
   PLAY DEV – main entry (Using Material Design)
   ========================= */
export function startPlayDev({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder }) {
  showPlayDevCardDialog({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder });
}

/* ====== Card effects ====== */

// Knight: הזזת השודד + גניבה + עדכון Largest Army
function playKnight({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout }) {
  const { enterRobberMove } = require("../game/robber.js"); // הימנעות ממעגליות ייבוא

  // 1) עדכן מונה אבירים + בעל Largest Army בתוך patch כדי לטריגר subscribe/ScorePanel
  const meIdx = state.currentPlayer - 1;
  patch(s => {
    const me = s.players[meIdx];
    me.knightsPlayed = (me.knightsPlayed || 0) + 1;
    // חישוב Largest Army: מינ' 3 וללא תיקו
    const ks = s.players.map(p => p?.knightsPlayed || 0);
    let bestIdx = null, bestVal = -1, tie = false;
    for (let i = 0; i < ks.length; i++) {
      const v = ks[i];
      if (v > bestVal) { bestVal = v; bestIdx = i; tie = false; }
      else if (v === bestVal) { tie = true; }
    }
    s.largestArmyOwner = (bestVal >= 3 && !tie) ? bestIdx : null;
  });

  // 2) מעבר למצב הזזת שודד (כולל גניבה) – ממחזר את ה-flow של 7
  state.phase = "move-robber";
  hud.showResult("Knight played — move the robber and steal 1 resource.");
  hud.setBottom("Click a tile to move the robber");
  hud.setRollEnabled(false);
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);
  hud.setBuyDevEnabled(false);
  hud.setPlayDevEnabled(false);

  enterRobberMove(
    { app, boardC, hud, state, tileSprites, robberSpriteRef, graph, layout, resPanel },
    () => {
      // 3) חזרה ל-play לאחר הזזה וגניבה
      state.phase = "play";
      hud.setBottom("You may build, trade, or end the turn");
      hud.setRollEnabled(false);
      hud.setEndEnabled(true);
      hud.setBuildRoadEnabled(true);
      hud.setBuildSettlementEnabled(true);
      hud.setBuildCityEnabled(true);
      hud.setTradeEnabled(true);
      hud.setBuyDevEnabled(true);
      hud.setPlayDevEnabled(true);
      hud.showResult("Robber moved.");
      // רענון לוח משאבים אם הגניבה שינתה ידיים
      resPanel?.updateResources?.(state.players);
    }
  );
}

// Road Building: placeholder – נשאר כמו לפני (שני כבישים בחינם)
function playRoadBuilding({ app, hud, state, boardC, graph, builder }) {
  const { startBuildRoad } = require("./buildRoad.js");
  let remaining = 2;

  hud.showResult("Road Building — place 2 roads for free.");
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);
  hud.setBuyDevEnabled(false);
  hud.setPlayDevEnabled(false);

  const placeNext = () => {
    if (remaining <= 0) {
      hud.setEndEnabled(true);
      hud.setBuildRoadEnabled(true);
      hud.setBuildSettlementEnabled(true);
      hud.setBuildCityEnabled(true);
      hud.setTradeEnabled(true);
      hud.setBuyDevEnabled(true);
      hud.setPlayDevEnabled(true);
      hud.showResult("Road Building complete.");
      return;
    }
    startBuildRoad(
      { app, boardC, hud, state, graph, builder },
      {
        free: true,
        onPlaced: () => { remaining--; placeNext(); },
        onCancel: () => { remaining = 0; placeNext(); }
      }
    );
  };
  placeNext();
}

// Year of Plenty
function playYearOfPlenty({ app, hud, state, resPanel }) {
  showYearOfPlentyDialog({ app, hud, state, resPanel });
}

// Monopoly
function playMonopoly({ app, hud, state, resPanel }) {
  showMonopolyDialog({ app, hud, state, resPanel });
}

/* ========= Reveal overlay (buy) ========= */
function showDevReveal({ app, card, onClose }) {
  const title = "Development Card";
  const message = `You drew: ${pretty(card)}\n\n${prettyDesc(card)}`;
  
  showMaterialConfirmDialog(app, {
    title,
    message,
    confirmText: "OK",
    hideCancel: true,
    onConfirm: () => onClose?.(),
    onClose: () => onClose?.()
  });
}

/* ========= Helpers & UI bits ========= */
function playableDevCounts(player) {
  const d = player.dev || {};
  const n = player.devNew || {};
  return {
    knight: Math.max(0, (d.knight||0) - (n.knight||0)),
    road_building: Math.max(0, (d.road_building||0) - (n.road_building||0)),
    year_of_plenty: Math.max(0, (d.year_of_plenty||0) - (n.year_of_plenty||0)),
    monopoly: Math.max(0, (d.monopoly||0) - (n.monopoly||0)),
  };
}

function drawDevCardFace(cardKey) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0xfef3c7).drawRoundedRect(0, 0, 96, 130, 10).endFill();
  g.lineStyle(2, 0x111827, 0.6).drawRoundedRect(0, 0, 96, 130, 10);
  c.addChild(g);

  const icon = new PIXI.Graphics(); icon.x = 48; icon.y = 46;
  switch (cardKey) {
    case "knight": icon.lineStyle(3,0x1f2937,1); icon.moveTo(-18,-18).lineTo(18,18); icon.moveTo(-10,-6).lineTo(-2,2); icon.moveTo(6,10).lineTo(12,16); break;
    case "road_building": icon.lineStyle(3,0x1f2937,1); icon.moveTo(-24,0).lineTo(24,0); icon.moveTo(-24,-8).lineTo(0,-8); icon.moveTo(4,-8).lineTo(24,-8); break;
    case "year_of_plenty": icon.beginFill(0x1f2937,1).drawPolygon([-18,10, 0,-16, 18,10]).endFill(); break;
    case "monopoly": icon.lineStyle(3,0x1f2937,1).drawCircle(0,0,20); break;
    case "vp": icon.beginFill(0x1f2937,1).drawPolygon([-18,8,-10,-12,0,8,10,-12,18,8]).endFill(); break;
  }
  c.addChild(icon);

  const t = new PIXI.Text(shortKey(cardKey), { fontFamily:"Arial", fontSize: 12, fill: 0x111827 });
  t.anchor.set(0.5, 0); t.x = 48; t.y = 92; c.addChild(t);
  return c;
}

function shortKey(k) {
  return ({ knight:"Knight", vp:"Victory", year_of_plenty:"Year of Plenty", monopoly:"Monopoly", road_building:"Road Building" })[k] || k;
}
function pretty(k) {
  return ({ knight:"Knight", vp:"Victory Point", year_of_plenty:"Year of Plenty", monopoly:"Monopoly", road_building:"Road Building" })[k] || k;
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


