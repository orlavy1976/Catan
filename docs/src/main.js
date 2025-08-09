import { initApp, root } from "./core/app.js";
import { drawBoard } from "./catan/tiles.js";
import { generateBoard } from "./catan/board.js";
import { drawToken, drawRobber } from "./catan/tokens.js";
import { state } from "./core/state.js";
import { createHUD } from "./catan/ui.js";
import { buildGraph } from "./catan/graph.js";
import { makeBuilder, PLAYER_COLORS } from "./catan/build.js";

const { app } = initApp();

const TILE_SIZE = 80;

// --- Build board + tokens ---
const layout = generateBoard();
const { boardC, axials, placeTile } = drawBoard(root, app, { size: TILE_SIZE });

const tileSprites = [];
let robber;
for (let i = 0; i < axials.length; i++) {
  const { kind, token } = layout[i];
  const g = placeTile(kind, axials[i]);
  tileSprites.push(g);
  if (kind === "desert") {
    robber = drawRobber(boardC, g.center);
  } else {
    drawToken(boardC, g.center, token);
  }
}

// --- Fit board to screen ---
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

// --- HUD ---
const hud = createHUD(app, root, ({ d1, d2, sum }) => {
  state.lastRoll = sum;
  hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
  hud.showResult(`Rolled ${d1} + ${d2} = ${sum}`);
});

// ======================
//      SETUP PHASE
// ======================
const graph = buildGraph(axials, TILE_SIZE);
const builder = makeBuilder(app, boardC, graph, state);

let occupiedVertices = new Set();
let occupiedEdges = new Set();

const interactiveLayer = new PIXI.Container();
boardC.addChild(interactiveLayer);

// Helpers
function currentPlayer() {
  return state.players[state.currentPlayer - 1];
}
function colorName(idx){
  return ["Red","Blue","Orange","Green"][idx] || "P";
}

function clearInteractions(){
  interactiveLayer.removeChildren();
  builder.clearGhosts();
}

// Snake order: 1→2→3→4→4→3→2→1
function nextPlayerSetup() {
  const p = state.currentPlayer;

  if (state.setup.round === 1) {
    if (p < state.players.length) {
      state.currentPlayer++;
    } else {
      state.setup.round = 2;
      state.currentPlayer = state.players.length; // start reverse at last
    }
  } else {
    if (p > 1) {
      state.currentPlayer--;
    } else {
      // Finished both rounds
      return finishSetup();
    }
  }

  state.setup.placing = "settlement";
  state.setup.lastSettlementVertex = null;
  hud.setBanner(`Setup — Player ${state.currentPlayer} (${colorName(currentPlayer().colorIdx)})`);
  hud.setBottom(`Setup: Place Settlement`);
  drawSettlementChoices();
}

function finishSetup() {
  clearInteractions();
  state.turn = 1;
  state.currentPlayer = 1;
  hud.setBanner(`Turn 1 — Player 1`);
  hud.setBottom(`Ready: Roll Dice`);
  // M3 ימשיך מכאן (חלוקת משאבים, רובבר ב-7, וכו')
}

// ---------- Interactions ----------
function drawSettlementChoices(){
  clearInteractions();
  const legals = builder.legalSettlementVertices(occupiedVertices);

  // ghost highlights
  legals.forEach(vId =>
    builder.drawSettlementGhost(vId, PLAYER_COLORS[currentPlayer().colorIdx], 0.35)
  );

  // hit targets
  legals.forEach(vId => {
    const v = graph.vertices[vId];
    const hit = new PIXI.Graphics();
    hit.beginFill(0x000000, 0.001);
    hit.drawCircle(v.x, v.y, 18);
    hit.endFill();
    hit.eventMode = 'static';
    hit.cursor = 'pointer';
    hit.on('pointertap', () => {
      // place settlement
      builder.placeSettlement(vId, currentPlayer().colorIdx);
      currentPlayer().settlements.push(vId);
      occupiedVertices.add(vId);

      state.setup.placing = "road";
      state.setup.lastSettlementVertex = vId;
      hud.setBottom(`Setup: Place Road`);
      drawRoadChoices();
    });
    interactiveLayer.addChild(hit);
  });
}

function drawRoadChoices(){
  clearInteractions();
  const vId = state.setup.lastSettlementVertex;
  const legals = builder.legalRoadEdges(occupiedEdges, occupiedVertices, vId);

  legals.forEach(eId =>
    builder.drawRoadGhost(eId, PLAYER_COLORS[currentPlayer().colorIdx], 0.35)
  );

  legals.forEach(eId => {
    const e = graph.edges[eId];
    const a = graph.vertices[e.a], b = graph.vertices[e.b];

    const hit = new PIXI.Graphics();
    hit.lineStyle({ width: 16, color: 0x000000, alpha: 0.001, cap: 'round' });
    hit.moveTo(a.x, a.y); hit.lineTo(b.x, b.y);
    hit.eventMode = 'static';
    hit.cursor = 'pointer';
    hit.on('pointertap', () => {
      // place road
      builder.placeRoad(eId, currentPlayer().colorIdx);
      currentPlayer().roads.push(eId);
      occupiedEdges.add(eId);

      // advance to next player in setup snake order
      nextPlayerSetup();
    });
    interactiveLayer.addChild(hit);
  });
}

// Start setup
hud.setBanner(`Setup — Player ${state.currentPlayer} (${colorName(currentPlayer().colorIdx)})`);
hud.setBottom(`Setup: Place Settlement`);
drawSettlementChoices();

// Optional: make the stage interactive-safe
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;
