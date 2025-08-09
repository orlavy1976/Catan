import { initApp, root } from "./core/app.js";
import { drawBoard } from "./catan/tiles.js";
import { generateBoard } from "./catan/board.js";
import { drawToken, drawRobber } from "./catan/tokens.js";
import { state } from "./core/state.js";
import { createHUD } from "./catan/ui.js";
import { buildGraph } from "./catan/graph.js";
import { makeBuilder, PLAYER_COLORS } from "./catan/build.js";
import { createResourcePanel } from "./catan/resourcePanel.js";

const { app } = initApp();

const TILE_SIZE = 80;

// ------------------------
//   BOARD + TOKENS
// ------------------------
const layout = generateBoard();
const { boardC, axials, placeTile } = drawBoard(root, app, { size: TILE_SIZE });

const tileSprites = [];
let robberSprite = null;

for (let i = 0; i < axials.length; i++) {
  const { kind, token } = layout[i];
  const g = placeTile(kind, axials[i]);
  tileSprites.push(g);
  if (kind === "desert") {
    robberSprite = drawRobber(boardC, g.center);
    state.robberTile = i;
  } else {
    drawToken(boardC, g.center, token);
  }
}

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

// ------------------------
//         HUD
// ------------------------
const hud = createHUD(app, root, onRolled, endTurn);
const resPanel = createResourcePanel(app, state);
resPanel.setCurrent(state.currentPlayer - 1);

// ------------------------
//     GRAPH + BUILDER
// ------------------------
const graph = buildGraph(axials, TILE_SIZE);
const builder = makeBuilder(app, boardC, graph, state);

let occupiedVertices = new Set();
let occupiedEdges = new Set();

const interactiveLayer = new PIXI.Container();
boardC.addChild(interactiveLayer);

function currentPlayer() {
  return state.players[state.currentPlayer - 1];
}
function colorName(idx) {
  return ["Red","Blue","Orange","Green"][idx] || "P";
}
function clearInteractions() {
  interactiveLayer.removeChildren();
  builder.clearGhosts();
  app.stage.off('pointertap');
}

// ------------------------
//       SETUP PHASE
// ------------------------
state.phase = "setup";
hud.setBanner(`Setup — Player ${state.currentPlayer} (${colorName(currentPlayer().colorIdx)})`);
hud.setBottom(`Setup: Place Settlement`);
hud.setRollEnabled(false);
hud.setEndEnabled(false);
drawSettlementChoices();

function nextPlayerSetup() {
  const p = state.currentPlayer;

  if (state.setup.round === 1) {
    if (p < state.players.length) {
      state.currentPlayer++;
    } else {
      state.setup.round = 2;
      state.currentPlayer = state.players.length; 
    }
  } else {
    if (p > 1) {
      state.currentPlayer--;
    } else {
      return finishSetup();
    }
  }

  resPanel.setCurrent(state.currentPlayer - 1);
  state.setup.placing = "settlement";
  state.setup.lastSettlementVertex = null;
  hud.setBanner(`Setup — Player ${state.currentPlayer} (${colorName(currentPlayer().colorIdx)})`);
  hud.setBottom(`Setup: Place Settlement`);
  drawSettlementChoices();
}

function finishSetup() {
  clearInteractions();
  state.phase = "play";
  state.turn = 1;
  state.currentPlayer = 1;
  hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
  hud.setBottom(`Ready: Roll Dice`);
  hud.setRollEnabled(true);
  hud.setEndEnabled(false);
  resPanel.setCurrent(state.currentPlayer - 1);
}

// 🆕 מקבלים משאבים ביישוב השני
function awardInitialResourcesForSettlement(vertexId, playerZeroIdx) {
  const v = graph.vertices[vertexId];
  const p = state.players[playerZeroIdx];
  const gained = { brick:0, wood:0, wheat:0, sheep:0, ore:0 };

  v.tiles.forEach(tileIdx => {
    const kind = layout[tileIdx].kind;
    if (kind === "desert") return;
    gained[kind] += 1;
    p.resources[kind] += 1;
  });

  resPanel.updateResources(state.players);

  const parts = ["brick","wood","wheat","sheep","ore"]
    .filter(k => gained[k] > 0)
    .map(k => `${gained[k]} ${k}`);
  if (parts.length) {
    hud.showResult(`Setup gain — P${p.id}: ${parts.join(", ")}`);
  }
}

// ----- Interactions: setup -----
function drawSettlementChoices() {
  clearInteractions();
  hud.setRollEnabled(false);
  hud.setEndEnabled(false);

  const legals = builder.legalSettlementVertices(occupiedVertices);
  legals.forEach(vId =>
    builder.drawSettlementGhost(vId, PLAYER_COLORS[currentPlayer().colorIdx], 0.35)
  );

  legals.forEach(vId => {
    const v = graph.vertices[vId];
    const hit = new PIXI.Graphics();
    hit.beginFill(0x000000, 0.001);
    hit.drawCircle(v.x, v.y, 18);
    hit.endFill();
    hit.eventMode = 'static';
    hit.cursor = 'pointer';
    hit.on('pointertap', () => {
      builder.placeSettlement(vId, currentPlayer().colorIdx);
      currentPlayer().settlements.push(vId);
      occupiedVertices.add(vId);

      if (state.setup.round === 2) {
        awardInitialResourcesForSettlement(vId, state.currentPlayer - 1);
      }

      state.setup.placing = "road";
      state.setup.lastSettlementVertex = vId;
      hud.setBottom(`Setup: Place Road`);
      drawRoadChoices();
    });
    interactiveLayer.addChild(hit);
  });
}

function drawRoadChoices() {
  clearInteractions();
  hud.setRollEnabled(false);
  hud.setEndEnabled(false);

  const vId = state.setup.lastSettlementVertex;
  const legals = builder.legalRoadEdges(occupiedEdges, occupiedVertices, vId);
  legals.forEach(eId =>
    builder.drawRoadGhost(eId, PLAYER_COLORS[currentPlayer().colorIdx], 0.35)
  );

  legals.forEach(eId => {
    const e = graph.edges[eId];
    const a = graph.vertices[e.a], b = graph.vertices[e.b];
    const hit = makeThickEdgeHit(a, b, 10);
    hit.eventMode = 'static';
    hit.cursor = 'pointer';
    hit.on('pointertap', () => {
      builder.placeRoad(eId, currentPlayer().colorIdx);
      currentPlayer().roads.push(eId);
      occupiedEdges.add(eId);
      nextPlayerSetup();
    });
    interactiveLayer.addChild(hit);
  });
}

function makeThickEdgeHit(a, b, half=10) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const p1 = [a.x + nx*half, a.y + ny*half];
  const p2 = [b.x + nx*half, b.y + ny*half];
  const p3 = [b.x - nx*half, b.y - ny*half];
  const p4 = [a.x - nx*half, a.y - ny*half];
  const poly = new PIXI.Polygon([...p1, ...p2, ...p3, ...p4]);
  const g = new PIXI.Graphics();
  g.hitArea = poly;
  g.beginFill(0x000000, 0.001);
  g.drawPolygon(poly.points);
  g.endFill();
  return g;
}

app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;

// ------------------------
//        PLAY PHASE
// ------------------------
function onRolled({ d1, d2, sum }) {
  state.lastRoll = sum;
  if (state.phase !== "play") return;

  if (sum === 7) {
    state.phase = "move-robber";
    hud.showResult("Rolled 7 — Move the robber");
    hud.setBottom("Click a tile to move the robber");
    hud.setRollEnabled(false);
    hud.setEndEnabled(false);
    enterRobberMove();
    return;
  }

  const gain = distributeResources(sum);
  const msg = summarizeGain(gain);
  if (msg) hud.showResult(msg);
  hud.setEndEnabled(true);
}

function distributeResources(sum) {
  const eligibleTiles = [];
  for (let i = 0; i < layout.length; i++) {
    if (i === state.robberTile) continue;
    const t = layout[i];
    if (t.token === sum && t.kind !== "desert") eligibleTiles.push(i);
  }

  const ownerByVertex = new Map();
  state.players.forEach((p, idx) => {
    p.settlements.forEach(vId => ownerByVertex.set(vId, idx));
  });

  const gainByPlayer = [initRes(), initRes(), initRes(), initRes()];
  eligibleTiles.forEach(tileIdx => {
    const kind = layout[tileIdx].kind;
    graph.vertices.forEach((v) => {
      if (v.tiles.has(tileIdx)) {
        const owner = ownerByVertex.get(v.id);
        if (owner != null) {
          gainByPlayer[owner][kind] += 1;
        }
      }
    });
  });

  state.players.forEach((p, idx) => {
    ["brick","wood","wheat","sheep","ore"].forEach(k => p.resources[k] += gainByPlayer[idx][k]);
  });

  resPanel.updateResources(state.players);
  return gainByPlayer;
}

function initRes() { return { brick:0, wood:0, wheat:0, sheep:0, ore:0 }; }

function summarizeGain(gainByPlayer) {
  const keys = ["brick","wood","wheat","sheep","ore"];
  const parts = [];
  gainByPlayer.forEach((g, idx) => {
    const arr = keys.filter(k => g[k] > 0).map(k => `${g[k]} ${k}`);
    if (arr.length) parts.push(`P${idx+1}: ` + arr.join(", "));
  });
  return parts.length ? `Resources — ${parts.join(" | ")}` : "No one produced.";
}

// ------------------------
//     ROBBER (on 7)
// ------------------------
function enterRobberMove() {
  clearInteractions();
  tileSprites.forEach((tileG, idx) => {
    if (idx === state.robberTile) return;
    const hit = new PIXI.Graphics();
    hit.beginFill(0x000000, 0.001);
    hit.drawCircle(tileG.center.x, tileG.center.y, 64);
    hit.endFill();
    hit.eventMode = 'static';
    hit.cursor = 'pointer';

    const ring = new PIXI.Graphics();
    ring.lineStyle({ width: 4, color: 0x000000, alpha: 0.25 });
    ring.drawCircle(tileG.center.x, tileG.center.y, 60);
    boardC.addChild(ring);

    hit.on('pointertap', () => {
      robberSprite.x = tileG.center.x;
      robberSprite.y = tileG.center.y;
      state.robberTile = idx;
      boardC.removeChild(ring);
      clearInteractions();
      state.phase = "play";
      hud.setBottom("Ready: End Turn");
      hud.setRollEnabled(false);
      hud.setEndEnabled(true);
      hud.showResult("Robber moved.");
    });
    interactiveLayer.addChild(hit);
  });
}

// ------------------------
//       END TURN
// ------------------------
function endTurn() {
  if (state.phase !== "play") return;
  state.currentPlayer++;
  if (state.currentPlayer > state.players.length) {
    state.currentPlayer = 1;
    state.turn++;
  }
  hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
  hud.setBottom(`Ready: Roll Dice`);
  hud.setRollEnabled(true);
  hud.setEndEnabled(false);
  resPanel.setCurrent(state.currentPlayer - 1);
}
