import { axialToPixel, hexPolygonPoints, standardAxials } from "../utils/geom.js";
import { colorFor } from "./board.js";
import { createTextures } from "../core/assets.js";

export function drawBoard(root, app, options = {}) {
  const { size = 64 } = options;
  const textures = createTextures(app ?? PIXI.Application.shared ?? PIXI.app ?? { renderer: PIXI.autoDetectRenderer?.() });

  const boardC = new PIXI.Container();
  root.addChild(boardC);

  // Sea backdrop with texture
  const sea = new PIXI.Graphics();
  sea.beginTextureFill({ texture: textures.water });
  sea.drawRoundedRect(-700, -600, 1400, 1200, 60);
  sea.endFill();
  sea.alpha = 0.95;
  boardC.addChild(sea);

  const axials = standardAxials();

  function placeTile(kind, axial) {
    const center = axialToPixel(axial, size);
    const pts = hexPolygonPoints(center, size);
    const g = new PIXI.Graphics();

    // Soft shadow
    g.beginFill(0x000000, 0.18);
    g.drawPolygon(hexPolygonPoints({x:center.x+4, y:center.y+5}, size));
    g.endFill();

    // Texture fill per resource
    const tex = {
      desert: textures.desert,
      wood: textures.wood,
      sheep: textures.sheep,
      wheat: textures.wheat,
      brick: textures.brick,
      ore: textures.ore,
    }[kind];

    if (tex) {
      g.beginTextureFill({ texture: tex });
    } else {
      g.beginFill(colorFor(kind));
    }
    g.drawPolygon(pts);
    g.endFill();

    // Inner bevel line
    g.lineStyle({ width: 2, color: 0x000000, alpha: 0.12, alignment: 0 });
    g.drawPolygon(pts);

    // Outer edge
    g.lineStyle({ width: 3, color: 0x2c2c2c, alpha: 0.35, alignment: 1 });
    g.drawPolygon(pts);

    g.kind = kind;
    g.center = center;
    boardC.addChild(g);
    return g;
  }

  return { boardC, axials, placeTile };
}
