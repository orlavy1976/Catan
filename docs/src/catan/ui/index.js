import { makeButton } from "./button.js";
import { makeDiceView } from "./diceView.js";

export function createHUD(app, root, onRoll, onEndTurn, onBuildRoad, onBuildSettlement, onBuildCity) {
  const hud = new PIXI.Container();
  root.addChild(hud);

  const pad = 20;
  const gap = 10;

  // ----- Buttons -----
  const rollBtn = makeButton("Roll Dice", 140);
  const buildSettlementBtn = makeButton("Build Settlement", 200);
  const buildRoadBtn = makeButton("Build Road", 140);
  const buildCityBtn = makeButton("Build City", 140);
  const endBtn = makeButton("End Turn", 140);

  const buttons = new PIXI.Container();
  buttons.addChild(rollBtn.container);
  buttons.addChild(buildSettlementBtn.container);
  buttons.addChild(buildRoadBtn.container);
  buttons.addChild(buildCityBtn.container);
  buttons.addChild(endBtn.container);
  hud.addChild(buttons);

  // ----- Dice (with animation) -----
  const dice = makeDiceView();
  hud.addChild(dice.container);

  // ----- Texts -----
  const bannerStyle = new PIXI.TextStyle({ fontFamily: "Arial", fontSize: 24, fill: 0xffffff, fontWeight: "bold" });
  const bannerText = new PIXI.Text("", bannerStyle);
  hud.addChild(bannerText);

  const bottomStyle = new PIXI.TextStyle({ fontFamily: "Arial", fontSize: 18, fill: 0xffffaa });
  const bottomText = new PIXI.Text("", bottomStyle);
  hud.addChild(bottomText);

  const resultStyle = new PIXI.TextStyle({ fontFamily: "Arial", fontSize: 16, fill: 0x99ff99 });
  const resultText = new PIXI.Text("", resultStyle);
  hud.addChild(resultText);

  // ----- Layout -----
  function layout() {
    // כפתורים: מימין לשמאל — End | City | Road | Settlement | Roll
    let x = app.renderer.width - pad;

    endBtn.container.x = x - endBtn.width; endBtn.container.y = pad; x = endBtn.container.x - gap;
    buildCityBtn.container.x = x - buildCityBtn.width; buildCityBtn.container.y = pad; x = buildCityBtn.container.x - gap;
    buildRoadBtn.container.x = x - buildRoadBtn.width; buildRoadBtn.container.y = pad; x = buildRoadBtn.container.x - gap;
    buildSettlementBtn.container.x = x - buildSettlementBtn.width; buildSettlementBtn.container.y = pad; x = buildSettlementBtn.container.x - gap;
    rollBtn.container.x = x - rollBtn.width; rollBtn.container.y = pad;

    // הקוביות ממוקמות מעט משמאל לכפתור ה-Roll
    dice.container.x = rollBtn.container.x - 160;
    dice.container.y = pad;

    // טקסטים משמאל
    bannerText.x = pad; bannerText.y = pad;
    bottomText.x = pad; bottomText.y = bannerText.y + bannerText.height + 6;
    resultText.x = pad; resultText.y = bottomText.y + bottomText.height + 6;
  }
  layout();
  window.addEventListener("resize", layout);

  // ----- Enable flags -----
  let rollEnabled = false;
  let endEnabled = false;
  let buildSettlementEnabled = false;
  let buildRoadEnabled = false;
  let buildCityEnabled = false;

  // ברירת מחדל: הכל כבוי (כולל Roll) עד שה-setup מסתיים
  rollBtn.setEnabled(false);
  endBtn.setEnabled(false);
  buildSettlementBtn.setEnabled(false);
  buildRoadBtn.setEnabled(false);
  buildCityBtn.setEnabled(false);

  // ----- Click handlers -----
  rollBtn.onClick(async () => {
    if (!rollEnabled) return;

    // אנימציה + תוצאה אמיתית
    await dice.shake(600);
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    const sum = d1 + d2;
    dice.set(d1, d2);

    // UI basic state (main גם שולט, אז זה רק QoL)
    setRollEnabled(false);
    setEndEnabled(true);

    // שולחים גם d1/d2 למקרה שתרצה בעתיד
    onRoll?.({ d1, d2, sum });
  });

  endBtn.onClick(() => {
    if (!endEnabled) return;
    dice.clear();
    setEndEnabled(false);
    setRollEnabled(true);
    setBuildRoadEnabled(false);
    setBuildSettlementEnabled(false);
    setBuildCityEnabled(false);
    onEndTurn?.();
  });

  buildRoadBtn.onClick(() => { if (buildRoadEnabled) onBuildRoad?.(); });
  buildSettlementBtn.onClick(() => { if (buildSettlementEnabled) onBuildSettlement?.(); });
  buildCityBtn.onClick(() => { if (buildCityEnabled) onBuildCity?.(); });

  // ----- Public API -----
  function setRollEnabled(e) { rollEnabled = e; rollBtn.setEnabled(e); }
  function setEndEnabled(e) { endEnabled = e; endBtn.setEnabled(e); }
  function setBuildSettlementEnabled(e) { buildSettlementEnabled = e; buildSettlementBtn.setEnabled(e); }
  function setBuildRoadEnabled(e) { buildRoadEnabled = e; buildRoadBtn.setEnabled(e); }
  function setBuildCityEnabled(e) { buildCityEnabled = e; buildCityBtn.setEnabled(e); }
  function setBanner(msg) { bannerText.text = msg; }
  function setBottom(msg) { bottomText.text = msg; }
  function showResult(msg) { resultText.text = msg; }

  return {
    setRollEnabled,
    setEndEnabled,
    setBuildSettlementEnabled,
    setBuildRoadEnabled,
    setBuildCityEnabled,
    setBanner,
    setBottom,
    showResult,
  };
}
