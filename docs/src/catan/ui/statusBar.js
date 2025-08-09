export function makeStatusBar(initialText = "") {
  const container = new PIXI.Container();
  const width = 620, height = 44, r = 12;

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.22);
  bg.drawRoundedRect(0, 0, width, height, r);
  bg.endFill();
  container.addChild(bg);

  const text = new PIXI.Text(initialText, {
    fontFamily: "Georgia, serif",
    fontSize: 18,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 3,
  });
  text.anchor.set(0, 0.5);
  text.x = 16; text.y = height/2;
  container.addChild(text);

  return {
    container,
    width, height,
    setText(t){ text.text = t; }
  };
}
