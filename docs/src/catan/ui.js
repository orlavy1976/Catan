// HUD: באנר, כפתור הטלת קוביות, כפתור End Turn, תצוגת קוביות והודעות
import { rollDice } from "./rules.js";

export function createHUD(app, root, onRolled, onEndTurn) {
  const hud = new PIXI.Container();
  hud.zIndex = 1000;
  app.stage.addChild(hud);
  app.stage.sortableChildren = true;

  // --- באנר עליון ---
  const banner = new PIXI.Container();
  const bannerBg = new PIXI.Graphics();
  bannerBg.beginFill(0x000000, 0.25);
  bannerBg.drawRoundedRect(0, 0, 620, 56, 16);
  bannerBg.endFill();
  banner.addChild(bannerBg);

  const bannerText = new PIXI.Text("Turn 1 — Player 1", {
    fontFamily: "Georgia, serif",
    fontSize: 22,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 3,
  });
  bannerText.anchor.set(0, 0.5);
  bannerText.x = 18;
  bannerText.y = 28;
  banner.addChild(bannerText);

  hud.addChild(banner);

  // --- כפתור הטלת קוביות ---
  const rollBtn = button("Roll Dice", 180);
  hud.addChild(rollBtn.container);

  // --- כפתור End Turn ---
  const endBtn = button("End Turn", 160);
  hud.addChild(endBtn.container);

  // --- תצוגת קוביות ---
  const diceC = new PIXI.Container();
  hud.addChild(diceC);

  function button(label, w) {
    const container = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0xffffff, 0.15);
    bg.drawRoundedRect(0, 0, w, 56, 16);
    bg.endFill();
    bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.35 });
    bg.drawRoundedRect(0, 0, w, 56, 16);
    container.addChild(bg);

    const txt = new PIXI.Text(label, {
      fontFamily: "Georgia, serif",
      fontSize: 20,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
    });
    txt.anchor.set(0.5);
    txt.x = w/2; txt.y = 28;
    container.addChild(txt);

    container.eventMode = "static";
    container.cursor = "pointer";

    return { container, bg, txt };
  }

  function drawDie(val, x) {
    const c = new PIXI.Container();
    c.x = x; c.y = 70;

    const g = new PIXI.Graphics();
    g.beginFill(0xf1f1f1);
    g.drawRoundedRect(-28, -28, 56, 56, 10);
    g.endFill();
    g.lineStyle({ width: 2, color: 0x222222, alpha: 0.35 });
    g.drawRoundedRect(-28, -28, 56, 56, 10);
    c.addChild(g);

    const pip = (px, py) => {
      const p = new PIXI.Graphics();
      p.beginFill(0x222222);
      p.drawCircle(px, py, 4);
      p.endFill();
      c.addChild(p);
    };

    const map = {
      1: [[0,0]],
      2: [[-12,-12],[12,12]],
      3: [[-12,-12],[0,0],[12,12]],
      4: [[-12,-12],[12,-12],[-12,12],[12,12]],
      5: [[-12,-12],[12,-12],[0,0],[-12,12],[12,12]],
      6: [[-12,-12],[12,-12],[-12,0],[12,0],[-12,12],[12,12]],
    };
    map[val].forEach(([px,py]) => pip(px,py));
    return c;
  }

  // --- פס תחתון למצב פעולה ---
  const bottom = new PIXI.Container();
  const bbg = new PIXI.Graphics();
  bbg.beginFill(0x000000, 0.22);
  bbg.drawRoundedRect(0, 0, 620, 44, 12);
  bbg.endFill();
  bottom.addChild(bbg);

  const bottomText = new PIXI.Text("Setup: Place Settlement", {
    fontFamily: "Georgia, serif",
    fontSize: 18,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 3,
  });
  bottomText.anchor.set(0, 0.5);
  bottomText.x = 16; bottomText.y = 22;
  bottom.addChild(bottomText);

  hud.addChild(bottom);

  // --- פריסה ---
  function layout() {
    const pad = 16;
    banner.x = pad; banner.y = pad;

    endBtn.container.x = app.renderer.width - 160 - pad;
    endBtn.container.y = pad;

    rollBtn.container.x = endBtn.container.x - 180 - 12;
    rollBtn.container.y = pad;

    diceC.x = rollBtn.container.x - 160;
    diceC.y = pad;

    bottom.x = pad;
    bottom.y = app.renderer.height - 44 - pad;
  }
  window.addEventListener("resize", layout);
  layout();

  let animTicker = null;
  let rollEnabled = true;
  let endEnabled = false;

  async function handleRoll() {
    if (!rollEnabled) return;

    // shake
    const start = performance.now();
    const tempDice = [drawDie(1, 40), drawDie(1, 110)];
    diceC.removeChildren();
    diceC.addChild(...tempDice);

    if (!animTicker) animTicker = new PIXI.Ticker();
    animTicker.add(() => {
      const t = (performance.now() - start) / 1000;
      const v1 = 1 + ((Math.random()*6)|0);
      const v2 = 1 + ((Math.random()*6)|0);
      diceC.removeChildren();
      diceC.addChild(drawDie(v1, 40), drawDie(v2, 110));
      diceC.scale.set(1 + Math.sin(t*20)*0.02);
    });
    animTicker.start();

    await wait(600);

    const { d1, d2, sum } = rollDice();
    animTicker.stop();
    diceC.scale.set(1);
    diceC.removeChildren();
    diceC.addChild(drawDie(d1, 40), drawDie(d2, 110));

    // אפשר לגלגל פעם אחת לתור — נכבה Roll עד סוף התור
    setRollEnabled(false);
    setEndEnabled(true);

    onRolled?.({ d1, d2, sum });
  }

  function handleEnd() {
    if (!endEnabled) return;
    // בסוף תור: ננקה קוביות ונדליק Roll לשחקן הבא
    diceC.removeChildren();
    setEndEnabled(false);
    setRollEnabled(true);
    onEndTurn?.();
  }

  rollBtn.container.on("pointertap", handleRoll);
  endBtn.container.on("pointertap", handleEnd);

  function setRollEnabled(enabled) {
    rollEnabled = enabled;
    styleButton(rollBtn.container, enabled);
  }
  function setEndEnabled(enabled) {
    endEnabled = enabled;
    styleButton(endBtn.container, enabled);
  }
  function styleButton(btn, enabled) {
    btn.alpha = enabled ? 1 : 0.5;
    btn.eventMode = enabled ? "static" : "none";
    btn.cursor = enabled ? "pointer" : "default";
  }

  return {
    setBanner(text) { bannerText.text = text; },
    setBottom(text) { bottomText.text = text; },
    showResult(text) {
      const msg = new PIXI.Text(text, {
        fontFamily: "Georgia, serif",
        fontSize: 18,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 3,
      });
      msg.x = 18; msg.y = 62;
      hud.addChild(msg);
      app.ticker.add(function fade(delta) {
        msg.alpha -= 0.02 * delta;
        if (msg.alpha <= 0) {
          app.ticker.remove(fade);
          hud.removeChild(msg);
          msg.destroy();
        }
      });
    },
    setRollEnabled: (e) => setRollEnabled(e),
    setEndEnabled: (e) => setEndEnabled(e),
  };
}

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }
