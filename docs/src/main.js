import { initApp, root } from "./core/app.js";
import { state } from "./core/state.js";
import { createHUD } from "./catan/ui/index.js";
import { createResourcePanel } from "./catan/resourcePanel.js";
import { buildGraph } from "./catan/graph.js";
import { makeBuilder } from "./catan/build/index.js";

import { buildBoard } from "./game/initBoard.js";
import { startSetupPhase } from "./game/setupPhase.js";
import { distributeResources, summarizeGain } from "./game/resources.js";
import { makeEndTurn } from "./game/turns.js";
import { enterRobberMove } from "./game/robber.js";
import { subscribe } from "./game/stateStore.js";
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
  () => { if (state.phase === "play") startBuildRoad({ app, boardC, hud, state, graph, builder }); },
  () => { if (state.phase === "play") startBuildSettlement({ app, boardC, hud, state, graph, builder }); },
  () => { if (state.phase === "play") startBuildCity({ app, boardC, hud, state, graph, builder }); }
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

// ---------- Setup Phase ----------
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

// ---------- Play Phase handlers ----------
function onRolled({ sum }) {
  if (state.phase !== "play") return;

  if (sum === 7) {
    state.phase = "move-robber";
    hud.showResult("Rolled 7 — Move the robber");
    hud.setBottom("Click a tile to move the robber");
    hud.setRollEnabled(false);
    hud.setEndEnabled(false);
    hud.setBuildRoadEnabled(false);
    hud.setBuildSettlementEnabled(false);
    hud.setBuildCityEnabled(false);
    enterRobberMove({
      app, boardC, hud, state, tileSprites, robberSpriteRef
    }, () => {
      state.phase = "play";
      hud.setBottom("Ready: End Turn");
      hud.setRollEnabled(false);
      hud.setEndEnabled(true);
      hud.setBuildRoadEnabled(false);
      hud.setBuildSettlementEnabled(false);
      hud.setBuildCityEnabled(false);
      hud.showResult("Robber moved.");
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

// stage safety
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;
