import { axialToPixel, hexPolygonPoints, standardAxials } from "../utils/geom.js";
import { colorFor } from "./board.js";
import { createTextures } from "../core/assets.js";

export function drawBoard(root, app, options = {}) {
  const { size = 64 } = options;
  const textures = createTextures(app ?? PIXI.Application.shared ?? PIXI.app ?? { renderer: PIXI.autoDetectRenderer?.() });

  const boardC = new PIXI.Container();
  boardC.sortableChildren = true; // אפשר מיון לפי Z-index
  root.addChild(boardC);

  // Sea backdrop with texture - always covers the full screen
  const sea = new PIXI.Graphics();
  function drawSea(x = 0, y = 0) {
    sea.clear();
    sea.beginTextureFill({ texture: textures.water });
    sea.drawRect(0, 0, app.renderer.width, app.renderer.height);
    sea.endFill();
    sea.alpha = 0.97;
    sea.zIndex = -1000;
    sea.position.set(-x, -y);
  }
  drawSea();
  boardC.addChildAt(sea, 0);
  // Responsive: redraw sea on resize
  window.addEventListener('resize', () => {
    drawSea(boardC.x, boardC.y);
  });
  // החזר פונקציה לעדכון הים מבחוץ (layoutBoard)
  boardC._updateSea = (x, y) => drawSea(x, y);

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
