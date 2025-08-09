export function makeButton(label, width = 160) {
  const height = 56, r = 16;
  const container = new PIXI.Container();

  const bg = new PIXI.Graphics();
  drawBg();
  container.addChild(bg);

  const txt = new PIXI.Text(label, {
    fontFamily: "Georgia, serif",
    fontSize: 20,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 3,
  });
  txt.anchor.set(0.5);
  txt.x = width/2; txt.y = height/2;
  container.addChild(txt);

  container.eventMode = "static";
  container.cursor = "pointer";

  let enabled = true;
  let clickHandler = null;

  container.on("pointertap", () => { if (enabled) clickHandler?.(); });

  function setEnabled(e) {
    enabled = e;
    container.alpha = e ? 1 : 0.5;
    container.eventMode = e ? "static" : "none";
    container.cursor = e ? "pointer" : "default";
  }

  function onClick(fn){ clickHandler = fn; }

  function drawBg(){
    bg.clear();
    bg.beginFill(0xffffff, 0.15);
    bg.drawRoundedRect(0, 0, width, height, r);
    bg.endFill();
    bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.35 });
    bg.drawRoundedRect(0, 0, width, height, r);
  }

  return {
    container,
    width, height,
    setEnabled,
    onClick,
  };
}
