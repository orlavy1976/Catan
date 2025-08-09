// HUD: כפתור הטלת קוביות + באנר תור + אנימציית קוביות
import { rollDice } from "./rules.js";

export function createHUD(app, root, onRolled) {
  const hud = new PIXI.Container();
  hud.zIndex = 1000;
  app.stage.addChild(hud);
  app.stage.sortableChildren = true;

  // רקע עליון לבאנר
  const banner = new PIXI.Container();
  const bannerBg = new PIXI.Graphics();
  bannerBg.beginFill(0x000000, 0.25);
  bannerBg.drawRoundedRect(0, 0, 420, 56, 16);
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

  // כפתור הטלת קוביות
  const rollBtn = new PIXI.Container();
  const btnBg = new PIXI.Graphics();
  btnBg.beginFill(0xffffff, 0.15);
  btnBg.drawRoundedRect(0, 0, 180, 56, 16);
  btnBg.endFill();
  btnBg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.35 });
  btnBg.drawRoundedRect(0, 0, 180, 56, 16);
  rollBtn.addChild(btnBg);

  const btnText = new PIXI.Text("Roll Dice", {
    fontFamily: "Georgia, serif",
    fontSize: 20,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 3,
  });
  btnText.anchor.set(0.5);
  btnText.x = 90; btnText.y = 28;
  rollBtn.addChild(btnText);

  rollBtn.eventMode = "static";
  rollBtn.cursor = "pointer";

  hud.addChild(rollBtn);

  // תצוגת קוביות
  const diceC = new PIXI.Container();
  hud.addChild(diceC);

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

  // פריסה ומיקום HUD בהתאם לגודל המסך
  function layout() {
    const pad = 16;
    banner.x = pad;
    banner.y = pad;

    rollBtn.x = app.renderer.width - 180 - pad;
    rollBtn.y = pad;

    diceC.x = rollBtn.x - 160; // לצד הכפתור
    diceC.y = pad;
  }

  window.addEventListener("resize", layout);
  layout();

  let animTicker = null;

  async function handleRoll() {
    // אנימציה קצרה של "רנדומיזציה"
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
      // רטט קטן
      diceC.scale.set(1 + Math.sin(t*20)*0.02);
    });
    animTicker.start();

    await wait(600); // משך "ניעור" קצר

    const { d1, d2, sum } = rollDice();
    animTicker.stop();
    diceC.scale.set(1);
    diceC.removeChildren();
    diceC.addChild(drawDie(d1, 40), drawDie(d2, 110));

    onRolled?.({ d1, d2, sum });
  }

  rollBtn.on("pointertap", handleRoll);

  return {
    setBanner(text) { bannerText.text = text; },
    showResult(text) {
      // הודעת תוצאה קטנה מתחת לבאנר
      const msg = new PIXI.Text(text, {
        fontFamily: "Georgia, serif",
        fontSize: 18,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 3,
      });
      msg.x = 18; msg.y = 62;
      hud.addChild(msg);
      // דהייה החוצה
      app.ticker.add(function fade(delta) {
        msg.alpha -= 0.02 * delta;
        if (msg.alpha <= 0) {
          app.ticker.remove(fade);
          hud.removeChild(msg);
          msg.destroy();
        }
      });
    }
  };
}

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }
