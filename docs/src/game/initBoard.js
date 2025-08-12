import { drawBoard } from "../catan/tiles.js";
import { generateBoard } from "../catan/board.js";
import { drawToken, drawRobber } from "../catan/tokens.js";
import { state } from "../core/state.js";
import { TILE_SIZE } from "../config/constants.js";
import { computeCoastEdges } from "../catan/coast.js";

const DEBUG_PORTS = false; // שנה ל-true אם תרצה לראות מספור צלעות חוף (דרך drawCoastDebug)

export function buildBoard(app, root) {
  // Use saved layout if available, otherwise generate new one
  let layout;
  if (state.boardLayout && Array.isArray(state.boardLayout)) {
    layout = state.boardLayout;
    console.log("🗺️ Using saved board layout");
  } else {
    layout = generateBoard(); // מערך אריחים עם token/kind
    state.boardLayout = layout; // Save the generated layout
    console.log("🗺️ Generated new board layout");
  }
  
  const { boardC, axials, placeTile } = drawBoard(root, app, { size: TILE_SIZE });

  const tileSprites = [];
  const robberSpriteRef = { sprite: null };

  // === אריחים + שודד ===
  let desertTileIndex = null;
  for (let i = 0; i < axials.length; i++) {
    const { kind, token } = layout[i];
    const g = placeTile(kind, axials[i]);
    tileSprites.push(g);
    if (kind === "desert") {
      desertTileIndex = i;
      // Only set robber tile if not already set (for saved games)
      if (state.robberTile === null || state.robberTile === undefined) {
        state.robberTile = i;
      }
    } else {
      drawToken(boardC, g.center, token);
    }
  }

  // Create robber sprite at appropriate position
  const robberTileIndex = state.robberTile !== null && state.robberTile !== undefined ? state.robberTile : desertTileIndex;
  if (robberTileIndex !== null && tileSprites[robberTileIndex]) {
    robberSpriteRef.sprite = drawRobber(boardC, tileSprites[robberTileIndex].center);
    robberSpriteRef.sprite.zIndex = 9999;
    console.log(`🔸 Robber placed at tile ${robberTileIndex} (${layout[robberTileIndex]?.kind})`);
  }

  // === חישוב חוף (צלעות חיצוניות) ===
  const coast = computeCoastEdges(axials, TILE_SIZE);

  // === נמלים לפי אינדקס חוף (כיילת כבר עם הדיבאגר) ===
  // הסדר תואם לקלאסיק (4×any + 5×ספציפיים, אבל אפשר לשנות בקלות)
  const types = [
    { ratio: 3, type: "any" },
    { ratio: 2, type: "wood" },
    { ratio: 3, type: "any" },
    { ratio: 2, type: "wheat" },
    { ratio: 3, type: "any" },
    { ratio: 2, type: "sheep" },
    { ratio: 3, type: "any" },
    { ratio: 2, type: "ore" },
    { ratio: 2, type: "brick" },
  ];
  // אינדקסים לדוגמה—אם צריך לשנות בקלות אחרי הדיבאגר:
  const posIndices = [2, 5, 8, 11, 14, 18, 21, 24, 27];

  const ports = [];

  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    const e = coast.edges[posIndices[i] % coast.edges.length];

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

    // נשמור נתונים מועילים למסחר:
    ports.push({
      ratio: t.ratio,
      type: t.type,
      coastIndex: e.index,
      // חשוב: שומר את נקודות הקצה של צלע החוף בפיקסלים
      edgePixels: { v1: { x: e.v1.x, y: e.v1.y }, v2: { x: e.v2.x, y: e.v2.y } },
    });
  }

  // לשימוש במסחר
  state.ports = ports;

  return { layout, boardC, tileSprites, axials, robberSpriteRef, ports, coast };
}
