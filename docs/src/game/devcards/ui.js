// UI helpers + labels shared by dev-cards
import { createBigButton, createChip } from "../../catan/ui/materialButton.js";

export function drawDevCardFace(cardKey) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0xfef3c7).drawRoundedRect(0, 0, 96, 130, 10).endFill();
  g.lineStyle(2, 0x111827, 0.6).drawRoundedRect(0, 0, 96, 130, 10);
  c.addChild(g);

  const icon = new PIXI.Graphics(); icon.x = 48; icon.y = 46;
  switch (cardKey) {
    case "knight": icon.lineStyle(3,0x1f2937,1); icon.moveTo(-18,-18).lineTo(18,18); icon.moveTo(-10,-6).lineTo(-2,2); icon.moveTo(6,10).lineTo(12,16); break;
    case "road_building": icon.lineStyle(3,0x1f2937,1); icon.moveTo(-24,0).lineTo(24,0); icon.moveTo(-24,-8).lineTo(0,-8); icon.moveTo(4,-8).lineTo(24,-8); break;
    case "year_of_plenty": icon.beginFill(0x1f2937,1).drawPolygon([-18,10, 0,-16, 18,10]).endFill(); break;
    case "monopoly": icon.lineStyle(3,0x1f2937,1).drawCircle(0,0,20); break;
    case "vp": icon.beginFill(0x1f2937,1).drawPolygon([-18,8,-10,-12,0,8,10,-12,18,8]).endFill(); break;
  }
  c.addChild(icon);

  const t = new PIXI.Text(shortKey(cardKey), { fontFamily:"Arial", fontSize: 12, fill: 0x111827 });
  t.anchor.set(0.5, 0); t.x = 48; t.y = 92; c.addChild(t);
  return c;
}

function shortKey(k) {
  return ({ knight:"Knight", vp:"Victory", year_of_plenty:"Year of Plenty", monopoly:"Monopoly", road_building:"Road Building" })[k] || k;
}

export function pretty(k) {
  return ({ knight:"Knight", vp:"Victory Point", year_of_plenty:"Year of Plenty", monopoly:"Monopoly", road_building:"Road Building" })[k] || k;
}

export function prettyDesc(k) {
  return ({
    knight: "Move the robber and steal 1 resource.",
    vp: "Keep hidden. Worth 1 victory point.",
    year_of_plenty: "Take any 2 resources from the bank.",
    monopoly: "Choose a resource; all players give you that resource.",
    road_building: "Build 2 roads for free.",
  })[k] || "";
}

// Legacy wrapper functions for backward compatibility
export function makeBigButton(label, onClick) {
  return createBigButton(label, onClick);
}

export function makeChip(label, onClick) {
  return createChip(label, onClick);
}
