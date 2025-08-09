// מרכיב ראשי של ה-HUD: באנר, קוביות, כפתורי Roll / Build Road / End Turn, ופס סטטוס
import { makeBanner } from "./banner.js";
import { makeButton } from "./button.js";
import { makeDiceView } from "./diceView.js";
import { makeStatusBar } from "./statusBar.js";
import { rollDice } from "../rules.js";

/**
 * @param {PIXI.Application} app
 * @param {PIXI.Container} root
 * @param {(res:{d1:number,d2:number,sum:number})=>void} onRolled
 * @param {()=>void} onEndTurn
 * @param {()=>void} onBuildRoad
 */
export function createHUD(app, root, onRolled, onEndTurn, onBuildRoad) {
  const hud = new PIXI.Container();
  hud.zIndex = 1000;
  app.stage.addChild(hud);
  app.stage.sortableChildren = true;

  // רכיבים
  const banner = makeBanner("Turn 1 — Player 1");
  hud.addChild(banner.container);

  const rollBtn = makeButton("Roll Dice", 180);
  hud.addChild(rollBtn.container);

  const buildRoadBtn = makeButton("Build Road", 180);
  hud.addChild(buildRoadBtn.container);

  const endBtn = makeButton("End Turn", 160);
  hud.addChild(endBtn.container);

  const dice = makeDiceView();
  hud.addChild(dice.container);

  const status = makeStatusBar("Setup: Place Settlement");
  hud.addChild(status.container);

  // -------- פריסה (למנוע חפיפה) --------
  function layout() {
    const pad = 16;
    const gap = 12;

    // באנר
    banner.container.x = pad;
    banner.container.y = pad;

    // כפתורים: מימין לשמאל — End | Build | Roll
    endBtn.container.x = app.renderer.width - endBtn.width - pad;
    endBtn.container.y = pad;

    buildRoadBtn.container.x = endBtn.container.x - gap - buildRoadBtn.width;
    buildRoadBtn.container.y = pad;

    rollBtn.container.x = buildRoadBtn.container.x - gap - rollBtn.width;
    rollBtn.container.y = pad;

    // קוביות משמאל ל־Roll
    dice.container.x = rollBtn.container.x - 160;
    dice.container.y = pad;

    // פס תחתון
    status.container.x = pad;
    status.container.y = app.renderer.height - status.height - pad;
  }
  window.addEventListener("resize", layout);
  layout();

  // -------- לוגיקה --------
  let rollEnabled = true;
  let endEnabled = false;
  let buildEnabled = false;

  rollBtn.onClick(async () => {
    if (!rollEnabled) return;

    await dice.shake(600);
    const { d1, d2, sum } = rollDice();
    dice.set(d1, d2);

    setRollEnabled(false);
    setEndEnabled(true);
    // על הדיפולט: main יחליט מתי להדליק build; אם תרצה — אפשר גם כאן:
    // setBuildEnabled(true);

    onRolled?.({ d1, d2, sum });
  });

  endBtn.onClick(() => {
    if (!endEnabled) return;
    dice.clear();
    setEndEnabled(false);
    setRollEnabled(true);
    setBuildEnabled(false);
    onEndTurn?.();
  });

  buildRoadBtn.onClick(() => {
    if (!buildEnabled) return;
    onBuildRoad?.();
  });

  // -------- API החוצה --------
  function setRollEnabled(enabled) {
    rollEnabled = enabled;
    rollBtn.setEnabled(enabled);
  }
  function setEndEnabled(enabled) {
    endEnabled = enabled;
    endBtn.setEnabled(enabled);
  }
  function setBuildEnabled(enabled) {
    buildEnabled = enabled;
    buildRoadBtn.setEnabled(enabled);
  }

  function showResult(text) {
    const msg = new PIXI.Text(text, {
      fontFamily: "Georgia, serif",
      fontSize: 18,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
    });
    msg.x = banner.container.x + 6;
    msg.y = banner.container.y + banner.height + 6;
    hud.addChild(msg);
    app.ticker.add(function fade(delta) {
      msg.alpha -= 0.02 * delta;
      if (msg.alpha <= 0) {
        app.ticker.remove(fade);
        hud.removeChild(msg);
        msg.destroy();
      }
    });
  }

  return {
    setBanner(text) { banner.setText(text); },
    setBottom(text) { status.setText(text); },
    showResult,
    setRollEnabled,
    setEndEnabled,
    setBuildEnabled,
  };
}
