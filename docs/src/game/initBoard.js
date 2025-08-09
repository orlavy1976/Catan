// docs/src/game/initBoard.js
import { drawBoard } from "../catan/tiles.js";
import { generateBoard, standardPortsByCoastIndex } from "../catan/board.js";
import { drawToken, drawRobber } from "../catan/tokens.js";
import { state } from "../core/state.js";
import { TILE_SIZE } from "../config/constants.js";
import { computeCoastEdges, drawCoastDebug } from "../catan/coast.js";

const DEBUG_PORTS = false; // שנה ל-true כדי לראות מספור צלעות חוף

export function buildBoard(app, root) {
  const layout = generateBoard(); // מערך אריחים עם token/kind
  const { boardC, axials, placeTile } = drawBoard(root, app, { size: TILE_SIZE });

  const tileSprites = [];
  const robberSpriteRef = { sprite: null };

  // === אריחים + שודד ===
  for (let i = 0; i < axials.length; i++) {
    const { kind, token } = layout[i];
    const g = placeTile(kind, axials[i]);
    tileSprites.push(g);
    if (kind === "desert") {
      robberSpriteRef.sprite = drawRobber(boardC, g.center);
      robberSpriteRef.sprite.zIndex = 9999;
      state.robberTile = i;
    } else {
      drawToken(boardC, g.center, token);
    }
  }

  // === חישוב חוף (צלעות חיצוניות) ===
  const coast = computeCoastEdges(axials, TILE_SIZE);
  if (DEBUG_PORTS) drawCoastDebug(boardC, coast, 0xffffff);

  // === נמלים ===
  const { types, posIndices } = standardPortsByCoastIndex();
  const ports = [];

  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    const idx = posIndices[i] % coast.edges.length;
    const e = coast.edges[idx];

    // נקודת אמצע ודחיפה החוצה
    const push = 26;
    const cx = e.mid.x + e.normal.x * push;
    const cy = e.mid.y + e.normal.y * push;

    // קווי "רציף" דקים
    const shore = new PIXI.Graphics();
    shore.lineStyle(3, 0xffffff, 0.85);
    shore.moveTo(e.v1.x, e.v1.y);
    shore.lineTo(cx, cy);
    shore.moveTo(e.v2.x, e.v2.y);
    shore.lineTo(cx, cy);
    boardC.addChild(shore);

    // אייקון הנמל
    const g = new PIXI.Graphics();
    g.beginFill(0xffffff, 0.9);
    g.drawCircle(0, 0, 22);
    g.endFill();
    g.lineStyle(2, 0x000000, 0.85);
    g.drawCircle(0, 0, 22);
    g.x = cx;
    g.y = cy;

    const label = t.ratio === 3 && t.type === "any" ? "3:1" : `2:1\n${t.type}`;
    const text = new PIXI.Text(label, {
      fontFamily: "Arial",
      fontSize: t.type === "any" ? 14 : 12,
      fill: 0x000000,
      align: "center"
    });
    text.anchor.set(0.5);
    g.addChild(text);

    boardC.addChild(g);

    // נשמור לוגיקה עתידית למסחר: איזה חוף/צלע
    ports.push({
      ratio: t.ratio,
      type: t.type,
      coastIndex: e.index,
      axial: e.a,
      side: e.side,
      mid: { x: e.mid.x, y: e.mid.y },
    });
  }

  // לשימוש במסחר בהמשך
  state.ports = ports;

  return { layout, boardC, tileSprites, axials, robberSpriteRef, ports, coast };
}
