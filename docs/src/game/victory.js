// Victory handling: check and show winner overlay
import { WIN_POINTS } from "./score.js";
import { createBigButton } from "../catan/ui/materialButton.js";

let _victoryShown = false;

export function maybeHandleVictory({ app, hud, state }, scores) {
  if (_victoryShown || state.phase === "ended") return;

  const meIdx = state.currentPlayer - 1;
  const my = scores?.[meIdx]?.total ?? 0;

  // כלל בסיסי בקטאן: מי שמגיע ראשון ל-10 בתורו — מנצח מיידית
  if (my >= WIN_POINTS) {
    state.phase = "ended";
    _victoryShown = true;
    lockHud(hud);
    showVictoryOverlay(app, meIdx + 1, my);
  }
}

function lockHud(hud) {
  try {
    hud.setRollEnabled(false);
    hud.setEndEnabled(false);
    hud.setBuildRoadEnabled(false);
    hud.setBuildSettlementEnabled(false);
    hud.setBuildCityEnabled(false);
    hud.setTradeEnabled(false);
    hud.setBuyDevEnabled(false);
    hud.setPlayDevEnabled(false);
  } catch {}
}

function showVictoryOverlay(app, playerNumber, points) {
  const overlay = new PIXI.Container();
  overlay.zIndex = 20000;

  const dim = new PIXI.Graphics();
  dim.beginFill(0x000000, 0.6).drawRect(0, 0, app.renderer.width, app.renderer.height).endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container(); overlay.addChild(panel);

  const bg = new PIXI.Graphics();
  bg.beginFill(0x111827, 0.98).drawRoundedRect(0, 0, 520, 240, 16).endFill();
  bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.15 }).drawRoundedRect(0, 0, 520, 240, 16);
  panel.addChild(bg);

  const title = new PIXI.Text("Victory!", { fontFamily: "Georgia, serif", fontSize: 28, fill: 0xffffaa });
  title.x = 24; title.y = 18; panel.addChild(title);

  const msg = new PIXI.Text(`Player ${playerNumber} wins with ${points} VP`, {
    fontFamily: "Georgia, serif",
    fontSize: 22,
    fill: 0xffffff
  });
  msg.x = 24; msg.y = 70; panel.addChild(msg);

  const tip = new PIXI.Text("Game over — actions are disabled.\nStart a new game from the menu/reload.", {
    fontFamily: "Arial",
    fontSize: 14,
    fill: 0xdddddd
  });
  tip.x = 24; tip.y = 112; panel.addChild(tip);

  const ok = createBigButton("OK", () => { /* משאירים את המסך — משחק הסתיים */ });
  ok.x = 520 - 110 - 20; ok.y = 240 - 36 - 20;
  panel.addChild(ok);

  panel.x = (app.renderer.width - 520) / 2;
  panel.y = (app.renderer.height - 240) / 2;

  app.stage.addChild(overlay);
}


