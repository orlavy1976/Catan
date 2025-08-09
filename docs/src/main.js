import { initApp, root } from "./core/app.js";
import { drawBoard } from "./catan/tiles.js";
import { generateBoard } from "./catan/board.js";
import { drawToken, drawRobber } from "./catan/tokens.js";
import { state } from "./core/state.js";
import { createHUD } from "./catan/ui.js";

const { app } = initApp();

const TILE_SIZE = 80;
const layout = generateBoard();
const { boardC, axials, placeTile } = drawBoard(root, app, { size: TILE_SIZE });

// place tiles
const tileSprites = [];
for (let i = 0; i < axials.length; i++) {
  const { kind } = layout[i];
  const g = placeTile(kind, axials[i]);
  tileSprites.push(g);
}

// tokens + robber
let robber;
for (let i = 0; i < tileSprites.length; i++) {
  const tile = tileSprites[i];
  const token = layout[i].token;
  if (layout[i].kind === "desert") {
    robber = drawRobber(boardC, tile.center);
  } else {
    drawToken(boardC, tile.center, token);
  }
}

// Hover outline (כמו שהיה)
const hover = new PIXI.Graphics();
boardC.addChild(hover);
app.stage.eventMode = 'static';
app.stage.hitArea = app.screen;
app.stage.on('pointermove', (e) => {
  const { x, y } = boardC.toLocal(e.global);
  let closest = null, d2Min = Infinity;
  for (const t of tileSprites) {
    const dx = t.center.x - x, dy = t.center.y - y;
    const d2 = dx*dx + dy*dy;
    if (d2 < d2Min) { d2Min = d2; closest = t; }
  }
  hover.clear();
  if (closest && Math.sqrt(d2Min) < TILE_SIZE * 0.9) {
    hover.lineStyle({ width: 4, color: 0xffffff, alpha: 0.5 });
    hover.drawPolygon(closest.geometry?.graphicsData?.[0]?.shape?.points ?? []);
  }
});

// Fit board
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
window.addEventListener('resize', layoutBoard);

// --- HUD ---
const hud = createHUD(app, root, ({ d1, d2, sum }) => {
  state.lastRoll = sum;
  hud.setBanner(`Turn ${state.turn} — Player ${state.currentPlayer}`);
  hud.showResult(`Rolled ${d1} + ${d2} = ${sum}`);
});
