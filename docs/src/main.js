import { initApp, root } from "./core/app.js";
import { state } from "./core/state.js";
import { createMaterialHUD } from "./catan/ui.js";
import { createResourcePanel } from "./catan/resourcePanel.js";
import { buildGraph } from "./catan/graph.js";
import { makeBuilder } from "./catan/build.js";

import { buildBoard } from "./game/initBoard.js";
import { startSetupPhase } from "./game/setupPhase.js";
import { distributeResources, summarizeGain } from "./game/resources.js";
import { makeEndTurn } from "./game/turns.js";
import { enterRobberMove } from "./game/robber.js";
import { enterDiscardPhase } from "./game/discard.js";
import { subscribe, patch } from "./game/stateStore.js";
import { startBuildRoad } from "./game/buildRoad.js";
import { startBuildSettlement } from "./game/buildSettlement.js";
import { startBuildCity } from "./game/buildCity.js";
import { rollDice } from "./catan/rules.js";
import { TILE_SIZE, BUILD_COSTS } from "./config/constants.js";

// New modern dialog system
import { showTradeMenu } from "./game/dialogs/tradeMenu.js";
import { showMaterialBuyDevCardDialog, showMaterialPlayDevCardDialog } from "./game/dialogs/materialDevcards.js";

// Dev cards (מודולריים) - keep for initialization
import { initDevDeck } from "./game/devcards/index.js";

// ניקוד + פאנל
import { computeScores } from "./game/score.js";
import { createScorePanel } from "./catan/scorePanel.js";

// ✅ חדש: בדיקת ניצחון
import { maybeHandleVictory } from "./game/victory.js";

const { app } = initApp();

// ---------- Board ----------
const { layout, boardC, tileSprites, axials, robberSpriteRef } = buildBoard(app, root);

// Fit board to screen with responsive UI support
function layoutBoard() {
  const xs = tileSprites.map(t => t.center.x);
  const ys = tileSprites.map(t => t.center.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  
  // Calculate available space considering UI panels
  const uiPadding = {
    left: 380,    // Space for notification panels + padding
    right: 240,   // Space for action buttons + padding  
    top: 60,      // Space for top elements
    bottom: 120   // Space for resource panels + padding
  };
  
  // Responsive adjustments for smaller screens
  const screenWidth = app.renderer.width;
  const screenHeight = app.renderer.height;
  
  if (screenWidth < 1200) {
    uiPadding.left = Math.min(320, screenWidth * 0.25);
    uiPadding.right = Math.min(200, screenWidth * 0.2);
  }
  
  if (screenHeight < 800) {
    uiPadding.top = Math.min(40, screenHeight * 0.05);
    uiPadding.bottom = Math.min(80, screenHeight * 0.1);
  }
  
  console.log("📐 Layout board with UI padding:", uiPadding, "Screen:", screenWidth, "x", screenHeight);
  
  const availableWidth = screenWidth - uiPadding.left - uiPadding.right;
  const availableHeight = screenHeight - uiPadding.top - uiPadding.bottom;
  
  const pad = 60; // Internal board padding
  const bw = (maxX - minX) + pad * 2;
  const bh = (maxY - minY) + pad * 2;
  
  const sx = availableWidth / bw;
  const sy = availableHeight / bh;
  const s = Math.min(sx, sy, 1.2); // Max scale limit to prevent over-sizing
  
  // Center the board in the available space
  const boardWidth = bw * s;
  const boardHeight = bh * s;
  
  boardC.scale.set(s);
  boardC.x = uiPadding.left + (availableWidth - boardWidth) / 2 - (minX - pad) * s;
  boardC.y = uiPadding.top + (availableHeight - boardHeight) / 2 - (minY - pad) * s;
  
  console.log("📐 Board positioned at:", boardC.x, boardC.y, "Scale:", s);
}
layoutBoard();

// ---------- UI ----------
const hud = createMaterialHUD(
  app,
  root,
  onRolled,
  endTurn,
  // onBuildRoad
  () => {
    if (state.phase !== "play" || !state._hasRolled) return;
    startBuildRoad({ app, boardC, hud, state, graph, builder });
  },
  // onBuildSettlement
  () => {
    if (state.phase !== "play" || !state._hasRolled) return;
    startBuildSettlement({ app, boardC, hud, state, graph, builder });
  },
  // onBuildCity
  () => {
    if (state.phase !== "play" || !state._hasRolled) return;
    startBuildCity({ app, boardC, hud, state, graph, builder });
  },
  // onTrade
  () => {
    try {
      console.log("🛍️ Trade");
      showTradeMenu({ app, hud, state, resPanel, graph });
    } catch (error) {
      console.error("Error in trade menu:", error);
    }
  },
  // onBuyDev
  () => {
    try {
      console.log("🃏 Buy dev card - Starting...");
      console.log("State phase:", state.phase);
      console.log("Has rolled:", state._hasRolled);
      showMaterialBuyDevCardDialog({ app, hud, state, resPanel, refreshScores });
      console.log("🃏 Buy dev card - Dialog called successfully");
    } catch (error) {
      console.error("Error in buy dev card dialog:", error);
    }
  },
  // onPlayDev
  () => {
    try {
      console.log("🎯 Play dev card");
      showMaterialPlayDevCardDialog({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder, refreshScores, refreshHudAvailability });
    } catch (error) {
      console.error("Error in play dev card dialog:", error);
    }
  }
);

const resPanel = createResourcePanel(app, state);
subscribe((s) => {
  resPanel.updateResources(s.players);
  resPanel.setCurrent(s.currentPlayer - 1);
  refreshHudAvailability();
  refreshScores();
});
resPanel.setCurrent(state.currentPlayer - 1);

// ⬅️ פאנל ניקוד
const scorePanel = createScorePanel(app, state);
root.addChild(scorePanel.container);

// ---------- Graph/Builder ----------
const graph = buildGraph(axials, TILE_SIZE);
const builder = makeBuilder(app, boardC, graph, state);

// ---------- Dev Deck ----------
initDevDeck(state);

// =====================
// ===== RESPONSIVE DESIGN ====
// =====================

// Enhanced responsive resize handling
function handleResize() {
  console.log("🔄 Window resize detected:", app.renderer.width, "x", app.renderer.height);
  
  // Update app renderer size
  app.renderer.resize(window.innerWidth, window.innerHeight);
  
  // Layout board first (affects available space for UI)
  layoutBoard();
  
  // Layout UI panels with delay to ensure board is positioned
  requestAnimationFrame(() => {
    // Resource panel layout
    resPanel?.layout?.();
    
    // HUD layout (includes action buttons and dice)
    hud?.layout?.();
    
    // Score panel layout if it has one
    scorePanel?.layout?.();
    
    console.log("✅ Responsive layout complete");
  });
}

// Debounced resize handler to prevent excessive layout calls
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleResize, 100); // 100ms debounce
});

// =====================
// ===== DEBUG MODE ====
// =====================
const DEBUG_MODE = true;

if (DEBUG_MODE) {
  debugInit();
} else {
  startSetupPhase({
    app, boardC, hud, resPanel, graph, builder, layout, state,
    onFinish: () => {
      state.phase = "play";
      state.turn = 1;
      state.currentPlayer = 1;
      state._hasRolled = false;
      hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
      hud.setBottom(`Ready: Roll Dice`);
      
      // Welcome notification showcasing the new notification system
      hud.showInfo("🎲 Game started! Roll dice to begin your turn. Click 📋 to view notification history.", 6000);
      
      refreshHudAvailability();
      refreshScores();
      resPanel.setCurrent(state.currentPlayer - 1);
    }
  });
}

// ---------- Play Phase handlers ----------
function onRolled(evt) {
  if (state.phase !== "play") return;

  const roll = evt ?? rollDice();
  console.log("🎲 Dice rolled:", roll); // Debug log
  
  if (hud?.dice && roll?.d1 != null && roll?.d2 != null) {
    console.log("🎲 Setting dice values:", roll.d1, roll.d2); // Debug log
    try { 
      hud.dice.set(roll.d1, roll.d2); 
    } catch (error) {
      console.error("🎲 Error setting dice:", error);
    }
  } else {
    console.warn("🎲 Missing hud.dice or roll values:", { hud: !!hud, dice: !!hud?.dice, roll });
  }
  
  const sum = roll?.sum ?? 0;
  state._hasRolled = true;

  // Add dice roll to notification history
  if (roll?.d1 != null && roll?.d2 != null) {
    const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const d1Emoji = diceEmoji[roll.d1 - 1] || '🎲';
    const d2Emoji = diceEmoji[roll.d2 - 1] || '🎲';
    hud.notifications.info(`${d1Emoji} ${d2Emoji} Rolled ${roll.d1} + ${roll.d2} = ${sum}`, 3000);
  }

  if (sum === 7) {
    state.phase = "discard";
    hud.showWarning("Rolled 7 — Discard then move the robber", 0); // Permanent until resolved
    hud.setBottom("Players with >7 must discard half.");
    refreshHudAvailability();
    refreshScores();

    enterDiscardPhase({ hud, state, resPanel }, () => {
      state.phase = "move-robber";
      hud.setBottom("Click a tile to move the robber");
      refreshHudAvailability();

      enterRobberMove({
        app, boardC, hud, state, tileSprites, robberSpriteRef, graph, layout, resPanel
      }, () => {
        state.phase = "play";
        hud.setBottom("You may build, trade, or end the turn");
        refreshHudAvailability();
        refreshScores();
      });
    });
    return;
  }

  const gain = distributeResources({ sum, state, layout, graph });
  const msg = summarizeGain(gain);
  if (msg) hud.showSuccess(msg);

  refreshHudAvailability();
  refreshScores();
}

function endTurn() {
  if (state.phase !== "play") return;
  const prev = state.players[state.currentPlayer - 1];
  if (prev?.devNew) for (const k in prev.devNew) prev.devNew[k] = 0;

  makeEndTurn(state)();
  state._hasRolled = false;
  hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
  hud.setBottom(`Ready: Roll Dice`);
  resPanel.setCurrent(state.currentPlayer - 1);
  refreshHudAvailability();
  refreshScores();
}

// stage safety
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

// ==========================
// ===== AVAILABILITY  ======
// ==========================
function refreshHudAvailability() {
  hud.setRollEnabled(false);
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);
  hud.setBuyDevEnabled(false);
  hud.setPlayDevEnabled(false);

  if (state.phase !== "play") return;

  const me = state.players[state.currentPlayer - 1];
  const hasRolled = !!state._hasRolled;

  hud.setRollEnabled(!hasRolled);
  hud.setEndEnabled(hasRolled);

  if (hasRolled && canPay(me.resources, BUILD_COSTS.road) && hasAnyLegalRoadPlacement()) hud.setBuildRoadEnabled(true);
  if (hasRolled && canPay(me.resources, BUILD_COSTS.settlement)) hud.setBuildSettlementEnabled(true);
  if (hasRolled && canPay(me.resources, BUILD_COSTS.city) && (me.settlements?.length > 0)) hud.setBuildCityEnabled(true);
  if (hasRolled) hud.setTradeEnabled(true);
  if (hasRolled && canPay(me.resources, { ore:1, wheat:1, sheep:1 }) && (state.devDeck?.length > 0)) hud.setBuyDevEnabled(true);
  if (hasRolled && hasPlayableDev(me)) hud.setPlayDevEnabled(true);
}

function canPay(res, cost){ for (const k in cost) if ((res[k]||0)<cost[k]) return false; return true; }

function hasAnyLegalRoadPlacement() {
  const occupiedEdges = new Set();
  state.players.forEach(p => p.roads?.forEach(eId => occupiedEdges.add(eId)));

  const networkVertices = new Set();
  const me = state.players[state.currentPlayer - 1];
  (me.settlements || []).forEach(vId => networkVertices.add(vId));
  (me.roads || []).forEach(eId => { const e = graph.edges[eId]; if (!e) return; networkVertices.add(e.a); networkVertices.add(e.b); });

  if (networkVertices.size === 0) return false;

  for (let eId = 0; eId < graph.edges.length; eId++) {
    if (occupiedEdges.has(eId)) continue;
    const e = graph.edges[eId]; if (!e) continue;
    if (networkVertices.has(e.a) || networkVertices.has(e.b)) return true;
  }
  return false;
}

function hasPlayableDev(player) {
  const d = player.dev || {};
  const n = player.devNew || {};
  const playable =
    Math.max(0,(d.knight||0)-(n.knight||0)) +
    Math.max(0,(d.road_building||0)-(n.road_building||0)) +
    Math.max(0,(d.year_of_plenty||0)-(n.year_of_plenty||0)) +
    Math.max(0,(d.monopoly||0)-(n.monopoly||0));
  return playable > 0;
}

// ==========================
// ===== SCORE REFRESH  =====
// ==========================
function refreshScores() {
  const { scores } = computeScores(state);
  scorePanel.setScores(scores);
  // ✅ בדוק ניצחון אחרי כל עדכון ניקוד
  maybeHandleVictory({ app, hud, state }, scores);
}

// ==========================
// ===== DEBUG HELPERS =====
// ==========================
function debugInit() {
  patch(s => {
    s.players.forEach(p => {
      for (const k of Object.keys(p.resources)) p.resources[k] = 5;
      p.settlements = p.settlements || [];
      p.cities = p.cities || [];
      p.roads = p.roads || [];
      p.dev = p.dev || { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
      p.devNew = p.devNew || { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
      p.knightsPlayed = p.knightsPlayed || 0;
    });
  });

  const occupiedVertices = new Set();
  const occupiedEdges = new Set();

  function placeSettlementAndRoadForPlayer(playerIndex, bias = 0) {
    const legalV = builder.legalSettlementVertices(occupiedVertices);
    if (!legalV.length) return;
    const vId = legalV[(bias * 7 + playerIndex * 3) % legalV.length];

    patch(s => { s.players[playerIndex].settlements.push(vId); });
    builder.placeSettlement(vId, state.players[playerIndex].colorIdx);
    occupiedVertices.add(vId);

    const legalE = builder.legalRoadEdges(occupiedEdges, occupiedVertices, vId);
    if (legalE.length) {
      const eId = legalE[(bias + playerIndex) % legalE.length];
      patch(s => { s.players[playerIndex].roads.push(eId); });
      builder.placeRoad(eId, state.players[playerIndex].colorIdx);
      occupiedEdges.add(eId);
    }
    return vId;
  }

  const n = state.players.length;
  const secondSpotByPlayer = new Array(n).fill(null);
  for (let i = 0; i < n; i++) placeSettlementAndRoadForPlayer(i, 0);
  for (let i = n - 1; i >= 0; i--) secondSpotByPlayer[i] = placeSettlementAndRoadForPlayer(i, 1);

  for (let i = 0; i < n; i++) {
    const vId = secondSpotByPlayer[i];
    if (vId == null) continue;
    const gained = computeInitialResourcesForVertex(vId);
    patch(s => {
      const res = s.players[i].resources;
      for (const k in gained) res[k] += gained[k];
    });
  }

  state.phase = "play";
  state.turn = 1;
  state.currentPlayer = 1;
  state._hasRolled = false;
  hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
  hud.setBottom(`Ready: Roll Dice`);
  refreshHudAvailability();
  refreshScores();
  resPanel.setCurrent(state.currentPlayer - 1);
}

function computeInitialResourcesForVertex(vertexId) {
  const v = graph.vertices[vertexId];
  const gained = { brick:0, wood:0, wheat:0, sheep:0, ore:0 };
  v.tiles.forEach(tileIdx => {
    const kind = layout[tileIdx].kind;
    if (kind === "desert") return;
    if (gained[kind] !== undefined) gained[kind] += 1;
  });
  return gained;
}
