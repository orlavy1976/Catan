const RES_LABELS = {
  brick: "Brick",
  wood:  "Wood",
  wheat: "Wheat",
  sheep: "Sheep",
  ore:   "Ore",
};
const RES_COLORS = {
  brick: 0xb24d3d,
  wood:  0x2a6e3a,
  wheat: 0xd9bb49,
  sheep: 0x7dbf6a,
  ore:   0x6c707d,
};

export function makeResIcon(kind) {
  const container = new PIXI.Container();

  const icon = new PIXI.Graphics();
  icon.beginFill(RES_COLORS[kind] ?? 0x888888, 0.95);
  icon.drawRoundedRect(0, 0, 22, 18, 4);
  icon.endFill();
  icon.lineStyle({ width: 1, color: 0x000000, alpha: 0.25 });
  icon.drawRoundedRect(0, 0, 22, 18, 4);
  container.addChild(icon);

  const letter = new PIXI.Text((RES_LABELS[kind] ?? "?")[0], {
    fontFamily: "Georgia, serif",
    fontSize: 12,
    fill: 0x101010,
    stroke: 0xffffff,
    strokeThickness: 2,
  });
  letter.anchor.set(0.5, 0.5);
  letter.x = 11; letter.y = 9;
  container.addChild(letter);

  const countText = new PIXI.Text("0", {
    fontFamily: "Georgia, serif",
    fontSize: 14,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 3,
  });
  countText.x = 26; countText.y = 0;
  container.addChild(countText);

  function setCount(n) {
    countText.text = String(n ?? 0);
  }

  return { container, setCount };
}
