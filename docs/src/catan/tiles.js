import { axialToPixel, hexPolygonPoints, standardAxials } from "../utils/geom.js";
import { colorFor } from "./board.js";

export function drawBoard(root, options = {}) {
  const { size = 64 } = options;

  // Container we can scale/center on resize
  const boardC = new PIXI.Container();
  root.addChild(boardC);

  // Draw sea backdrop as a rounded rectangle behind everything
  const sea = new PIXI.Graphics();
  sea.beginFill(colorFor("water"));
  sea.drawRoundedRect(-700, -600, 1400, 1200, 60);
  sea.endFill();
  sea.alpha = 0.92;
  boardC.addChild(sea);

  // Axial positions (19 tiles)
  const axials = standardAxials();

  // Return helpers for external use (so main.js can place tokens/robber)
  function placeTile(kind, axial) {
    const center = axialToPixel(axial, size);
    const pts = hexPolygonPoints(center, size);
    const g = new PIXI.Graphics();

    // Drop shadow
    g.beginFill(0x000000, 0.18);
    g.drawPolygon(hexPolygonPoints({x:center.x+4, y:center.y+5}, size));
    g.endFill();

    // Core fill
    g.beginFill(colorFor(kind));
    g.drawPolygon(pts);
    g.endFill();

    // Bevel-ish inner ring
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
