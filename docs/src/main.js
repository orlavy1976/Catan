import { initApp, root } from "./core/app.js";
import { state } from "./core/state.js";
import { createHUD } from "./catan/ui.js";
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
import { startTradeMenu } from "./game/trade.js";
import { rollDice } from "./catan/rules.js";
import { TILE_SIZE, BUILD_COSTS } from "./config/constants.js";

// Dev cards (מודולריים)
import { initDevDeck, startBuyDevCard, startPlayDev } from "./game/devcards/index.js";

// ניקוד + פאנל
import { computeScores } from "./game/score.js";
import { createScorePanel } from "./catan/scorePanel.js";

// ✅ חדש: בדיקת ניצחון
import { maybeHandleVictory } from "./game/victory.js";

const { app } = initApp();

// ---------- Board ----------
const { layout, boardC, tileSprites, axials, robberSpriteRef } = buildBoard(app, root);

// Fit board to screen
function layoutBoard() {
  const xs = tileSprites.map(t => t.center.x);
  const ys = tileSprites.map(t => t.center.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 120;
  const bw = (maxX - minX) + pad * 2;
  const bh = (maxY - minY) + pad * 2;
  const sx = app.renderer.width / bw;
  const sy = app.renderer.height / bh;
  const s = Math.min(sx, sy);
  boardC.scale.set(s);
  boardC.x = (app.renderer.width - bw * s) / 2 - (minX - pad) * s;
  boardC.y = (app.renderer.height - bh * s) / 2 - (minY - pad) * s;
}
layoutBoard();
window.addEventListener("resize", layoutBoard);

// ---------- UI ----------
const hud = createHUD(
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
    if (state.phase !== "play" || !state._hasRolled) return;
    startTradeMenu({ app, hud, state, resPanel, graph });
  },
  // onBuyDev
  () => {
    if (state.phase !== "play" || !state._hasRolled) return;
    startBuyDevCard({ app, hud, state, resPanel });
    refreshHudAvailability();
    refreshScores(); // ייתכן שקלף VP יעלה ל-10
  },
  // onPlayDev
  () => {
    if (state.phase !== "play" || !state._hasRolled) return;
    startPlayDev({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder });
    refreshHudAvailability();
    refreshScores();
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
  if (hud?.dice && roll?.d1 != null && roll?.d2 != null) {
    try { hud.dice.set(roll.d1, roll.d2); } catch {}
  }
  const sum = roll?.sum ?? 0;
  state._hasRolled = true;

  if (sum === 7) {
    state.phase = "discard";
    hud.showResult("Rolled 7 — Discard then move the robber");
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
  if (msg) hud.showResult(msg);

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
