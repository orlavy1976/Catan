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
  () => {
    if (state.phase !== "play") return;
    startBuildRoad({ app, boardC, hud, state, graph, builder });
  },
  () => {
    if (state.phase !== "play") return;
    startBuildSettlement({ app, boardC, hud, state, graph, builder });
  },
  () => {
    if (state.phase !== "play") return;
    startBuildCity({ app, boardC, hud, state, graph, builder });
  }
);

const resPanel = createResourcePanel(app, state);
subscribe((s) => {
  resPanel.updateResources(s.players);
  resPanel.setCurrent(s.currentPlayer - 1);
});
resPanel.setCurrent(state.currentPlayer - 1);

// ---------- Graph/Builder ----------
const graph = buildGraph(axials, 80);
const builder = makeBuilder(app, boardC, graph, state);

// =====================
// ===== DEBUG MODE ====
// =====================
const DEBUG_MODE = true; // ← החלף ל-false למשחק רגיל

if (DEBUG_MODE) {
  debugInit();
} else {
  startSetupPhase({
    app, boardC, hud, resPanel, graph, builder, layout, state,
    onFinish: () => {
      state.phase = "play";
      state.turn = 1;
      state.currentPlayer = 1;
      hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
      hud.setBottom(`Ready: Roll Dice`);
      hud.setRollEnabled(true);
      hud.setEndEnabled(false);
      hud.setBuildRoadEnabled(false);
      hud.setBuildSettlementEnabled(false);
      hud.setBuildCityEnabled(false);
      resPanel.setCurrent(state.currentPlayer - 1);
    }
  });
}

// ---------- Play Phase handlers ----------
function onRolled({ sum }) {
  if (state.phase !== "play") return;

  if (sum === 7) {
    state.phase = "discard";
    hud.showResult("Rolled 7 — Discard then move the robber");
    hud.setBottom("Players with >7 must discard half.");
    hud.setRollEnabled(false);
    hud.setEndEnabled(false);
    hud.setBuildRoadEnabled(false);
    hud.setBuildSettlementEnabled(false);
    hud.setBuildCityEnabled(false);

    enterDiscardPhase({ hud, state, resPanel }, () => {
      state.phase = "move-robber";
      hud.setBottom("Click a tile to move the robber");
      enterRobberMove({
        app, boardC, hud, state, tileSprites, robberSpriteRef, graph, layout, resPanel
      }, () => {
        state.phase = "play";
        hud.setBottom("You may build or end the turn");
        hud.setRollEnabled(true);
        hud.setEndEnabled(true);
        hud.setBuildRoadEnabled(true);
        hud.setBuildSettlementEnabled(true);
        hud.setBuildCityEnabled(true);
      });
    });
    return;
  }

  const gain = distributeResources({ sum, state, layout, graph });
  const msg = summarizeGain(gain);
  if (msg) hud.showResult(msg);

  hud.setEndEnabled(true);
  hud.setBuildRoadEnabled(true);
  hud.setBuildSettlementEnabled(true);
  hud.setBuildCityEnabled(true);
}

function endTurn() {
  if (state.phase !== "play") return;
  makeEndTurn(state)();
  hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
  hud.setBottom(`Ready: Roll Dice`);
  hud.setRollEnabled(true);
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  resPanel.setCurrent(state.currentPlayer - 1);
}

app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

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
  for (let i = 0; i < n; i++) {
    placeSettlementAndRoadForPlayer(i, 0);
  }
  for (let i = n - 1; i >= 0; i--) {
    const vId = placeSettlementAndRoadForPlayer(i, 1);
    secondSpotByPlayer[i] = vId;
  }

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
  hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
  hud.setBottom(`Ready: Roll Dice`);
  hud.setRollEnabled(true);
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
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
