// Number tokens + simple robber marker
export function drawToken(root, center, value) {
  if (value === 7) return null;

  const c = new PIXI.Container();
  c.x = center.x; c.y = center.y;

  const bg = new PIXI.Graphics();
  bg.beginFill(0xf1e9d2);
  bg.drawCircle(0, 0, 22);
  bg.endFill();

  // rim
  bg.lineStyle({ width: 3, color: 0x5a4730, alpha: 0.4 });
  bg.drawCircle(0, 0, 22);

  c.addChild(bg);

  // pips (red on 6/8)
  const isHot = (value === 6 || value === 8);
  const txt = new PIXI.Text(String(value), {
    fontFamily: 'Georgia, serif',
    fontSize: 20,
    fill: isHot ? 0xb21a1a : 0x2a2a2a,
    stroke: 0xffffff,
    strokeThickness: isHot ? 2 : 1,
  });
  txt.anchor.set(0.5);
  txt.y = -2;
  c.addChild(txt);

  // probability dots
  const dots = dotsFor(value);
  const dotY = 14;
  const dotSpacing = 8;
  const totalWidth = (dots - 1) * dotSpacing;
  for (let i = 0; i < dots; i++) {
    const d = new PIXI.Graphics();
    d.beginFill(isHot ? 0xb21a1a : 0x2a2a2a);
    d.drawCircle(-totalWidth/2 + i*dotSpacing, dotY, 2);
    d.endFill();
    c.addChild(d);
  }

  root.addChild(c);
  return c;
}

export function drawRobber(root, center) {
  const r = new PIXI.Container();
  r.x = center.x; r.y = center.y;

  const base = new PIXI.Graphics();
  base.beginFill(0x1f1f1f);
  base.drawPolygon(0, -18, 10, 0, 0, 8, -10, 0);
  base.endFill();

  const eye = new PIXI.Graphics();
  eye.beginFill(0xffffff);
  eye.drawRect(-6, -11, 12, 4);
  eye.endFill();

  const pupilL = new PIXI.Graphics();
  pupilL.beginFill(0x000000);
  pupilL.drawCircle(-2, -9, 1.2);
  pupilL.endFill();

  const pupilR = new PIXI.Graphics();
  pupilR.beginFill(0x000000);
  pupilR.drawCircle(2, -9, 1.2);
  pupilR.endFill();

  r.addChild(base, eye, pupilL, pupilR);
  root.addChild(r);
  return r;
}

function dotsFor(n) {
  const map = {2:1,3:2,4:3,5:4,6:5,8:5,9:4,10:3,11:2,12:1};
  return map[n] ?? 0;
}
