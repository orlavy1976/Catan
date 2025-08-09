import { drawBoard } from "../catan/tiles.js";
import { generateBoard } from "../catan/board.js";
import { drawToken, drawRobber } from "../catan/tokens.js";
import { state } from "../core/state.js";
import { TILE_SIZE } from "../config/constants.js";

export function buildBoard(app, root) {
  const layout = generateBoard();
  const { boardC, axials, placeTile } = drawBoard(root, app, { size: TILE_SIZE });

  const tileSprites = [];
  const robberSpriteRef = { sprite: null };

  for (let i = 0; i < axials.length; i++) {
    const { kind, token } = layout[i];
    const g = placeTile(kind, axials[i]);
    tileSprites.push(g);
    if (kind === "desert") {
      robberSpriteRef.sprite = drawRobber(boardC, g.center);
      state.robberTile = i;
    } else {
      drawToken(boardC, g.center, token);
    }
  }

  return { layout, boardC, tileSprites, axials, robberSpriteRef };
}
