// מרכיב ראשי של ה-HUD: מרכיב באנר, קוביות, כפתורי Roll/End ופס תחתון
import { makeBanner } from "./banner.js";
import { makeButton } from "./button.js";
import { makeDiceView } from "./diceView.js";
import { makeStatusBar } from "./statusBar.js";
import { rollDice } from "../rules.js";

export function createHUD(app, root, onRolled, onEndTurn) {
  const hud = new PIXI.Container();
  hud.zIndex = 1000;
  app.stage.addChild(hud);
  app.stage.sortableChildren = true;

  // רכיבים
  const banner = makeBanner("Turn 1 — Player 1");
  hud.addChild(banner.container);

  const rollBtn = makeButton("Roll Dice", 180);
  hud.addChild(rollBtn.container);

  const endBtn = makeButton("End Turn", 160);
  hud.addChild(endBtn.container);

  const dice = makeDiceView();
  hud.addChild(dice.container);

  const status = makeStatusBar("Setup: Place Settlement");
  hud.addChild(status.container);

  // פריסה
  function layout() {
    const pad = 16;
    banner.container.x = pad;
    banner.container.y = pad;

    endBtn.container.x = app.renderer.width - endBtn.width - pad;
    endBtn.container.y = pad;

    rollBtn.container.x = endBtn.container.x - rollBtn.width - 12;
    rollBtn.container.y = pad;

    dice.container.x = rollBtn.container.x - 160;
    dice.container.y = pad;

    status.container.x = pad;
    status.container.y = app.renderer.height - status.height - pad;
  }
  window.addEventListener("resize", layout);
  layout();

  // לוגיקה — Roll & End
  let rollEnabled = true;
  let endEnabled = false;

  rollBtn.onClick(async () => {
    if (!rollEnabled) return;

    await dice.shake(600);
    const { d1, d2, sum } = rollDice();
    dice.set(d1, d2);

    setRollEnabled(false);
    setEndEnabled(true);
    onRolled?.({ d1, d2, sum });
  });

  endBtn.onClick(() => {
    if (!endEnabled) return;
    dice.clear();
    setEndEnabled(false);
    setRollEnabled(true);
    onEndTurn?.();
  });

  function setRollEnabled(enabled) {
    rollEnabled = enabled;
    rollBtn.setEnabled(enabled);
  }
  function setEndEnabled(enabled) {
    endEnabled = enabled;
    endBtn.setEnabled(enabled);
  }

  // הודעות חולפות (toast)
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
  };
}
