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

  // Shadow for depth (Material Design elevation)
  const shadow = new PIXI.Graphics();
  shadow.beginFill(0x000000, 0.25);
  shadow.drawEllipse(2, 12, 16, 6); // Elliptical shadow at base
  shadow.endFill();
  r.addChild(shadow);

  // Main body - hooded figure with gradient effect
  const body = new PIXI.Graphics();
  
  // Dark hood/cloak
  body.beginFill(0x1a1a1a);
  body.drawPolygon([
    0, -20,    // Top of hood
    -12, -15,  // Left side of hood
    -14, 0,    // Left shoulder
    -8, 8,     // Left bottom
    0, 10,     // Center bottom
    8, 8,      // Right bottom
    14, 0,     // Right shoulder
    12, -15,   // Right side of hood
  ]);
  body.endFill();
  
  // Add subtle highlight on hood edge for depth
  body.lineStyle({ width: 1, color: 0x404040, alpha: 0.6 });
  body.moveTo(-12, -15);
  body.lineTo(0, -20);
  body.lineTo(12, -15);
  
  r.addChild(body);

  // Hood interior darkness
  const hoodInterior = new PIXI.Graphics();
  hoodInterior.beginFill(0x0f0f0f);
  hoodInterior.drawPolygon([
    0, -18,
    -10, -13,
    -10, -8,
    0, -6,
    10, -8,
    10, -13
  ]);
  hoodInterior.endFill();
  r.addChild(hoodInterior);

  // Glowing red eyes for menacing look
  const eyeGlow = new PIXI.Graphics();
  eyeGlow.beginFill(0xff2020, 0.8);
  eyeGlow.drawCircle(-3, -11, 2);
  eyeGlow.drawCircle(3, -11, 2);
  eyeGlow.endFill();
  
  // Inner bright spots
  eyeGlow.beginFill(0xff6060);
  eyeGlow.drawCircle(-3, -11, 1);
  eyeGlow.drawCircle(3, -11, 1);
  eyeGlow.endFill();
  
  r.addChild(eyeGlow);

  // Arms/sleeves extending from sides
  const leftArm = new PIXI.Graphics();
  leftArm.beginFill(0x2a2a2a);
  leftArm.drawRoundedRect(-18, -5, 8, 12, 3);
  leftArm.endFill();
  r.addChild(leftArm);

  const rightArm = new PIXI.Graphics();
  rightArm.beginFill(0x2a2a2a);
  rightArm.drawRoundedRect(10, -5, 8, 12, 3);
  rightArm.endFill();
  r.addChild(rightArm);

  // Add a subtle pulsing animation to the eyes
  let pulseDirection = 1;
  const animate = () => {
    if (eyeGlow.alpha <= 0.6) pulseDirection = 1;
    if (eyeGlow.alpha >= 1.0) pulseDirection = -1;
    eyeGlow.alpha += pulseDirection * 0.02;
  };
  
  // Set up animation ticker if not already set
  if (!r._robberTicker) {
    r._robberTicker = PIXI.Ticker.shared.add(animate);
  }

  // Add cleanup function to container
  r.destroy = function() {
    if (this._robberTicker) {
      PIXI.Ticker.shared.remove(animate);
      this._robberTicker = null;
    }
    PIXI.Container.prototype.destroy.call(this, arguments);
  };

  root.addChild(r);
  return r;
}

function dotsFor(n) {
  const map = {2:1,3:2,4:3,5:4,6:5,8:5,9:4,10:3,11:2,12:1};
  return map[n] ?? 0;
}
