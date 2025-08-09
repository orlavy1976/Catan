import { makeButton } from "./button.js";
import { makeDiceView } from "./diceView.js";

export function createHUD(app, root, onRoll, onEndTurn, onBuildRoad, onBuildSettlement, onBuildCity, onTrade) {
  const hud = new PIXI.Container();
  root.addChild(hud);

  // layout constants
  const pad = 20;         // padding מהקצוות
  const gap = 10;         // רווח בין כפתורים
  const gapLarge = 14;    // רווח גדול יותר בין קוביות לכפתורים
  const colWidth = 200;   // רוחב הטור הימני (מרווח לכפתור הרחב ביותר)

  // ----- Buttons -----
  const rollBtn = makeButton("Roll Dice", 160);
  const buildSettlementBtn = makeButton("Build Settlement", 200);
  const buildRoadBtn = makeButton("Build Road", 160);
  const buildCityBtn = makeButton("Build City", 160);
  const tradeBtn = makeButton("Trade", 140);
  const endBtn = makeButton("End Turn", 160);

  // נשמור אותם בסדר מלמעלה למטה
  const colButtons = [
    rollBtn,
    buildSettlementBtn,
    buildRoadBtn,
    buildCityBtn,
    tradeBtn,
    endBtn
  ];
  colButtons.forEach(b => hud.addChild(b.container));

  // ----- Dice -----
  const dice = makeDiceView(); // container פנימי עם שני קוביות
  hud.addChild(dice.container);

  // ----- Texts (בצד שמאל כמו קודם) -----
  const bannerStyle = new PIXI.TextStyle({ fontFamily: "Georgia, serif", fontSize: 22, fill: 0xffffff, stroke: 0x000000, strokeThickness: 4 });
  const bannerText = new PIXI.Text("", bannerStyle);
  hud.addChild(bannerText);

  const bottomStyle = new PIXI.TextStyle({ fontFamily: "Arial", fontSize: 18, fill: 0xffffaa });
  const bottomText = new PIXI.Text("", bottomStyle);
  hud.addChild(bottomText);

  const resultStyle = new PIXI.TextStyle({ fontFamily: "Arial", fontSize: 16, fill: 0x99ff99 });
  const resultText = new PIXI.Text("", resultStyle);
  hud.addChild(resultText);

  // ----- Layout (ממקם את הטור הימני + הקוביות + טקסטים) -----
  function layout() {
    // עוגן הטור הימני
    const colX = app.renderer.width - pad - colWidth;
    let cy = pad;

    // קוביות בראש הטור (מרוכזות אופקית בתוך colWidth)
    const diceW = 150;      // רוחב משוער של אזור הקוביות (שתי קוביות + רווח)
    dice.container.x = colX + Math.round((colWidth - diceW) / 2);
    dice.container.y = cy;
    cy += 120 + gapLarge;   // גובה בלוק הקוביות + רווח

    // כפתורים – טור אנכי
    colButtons.forEach(btn => {
      // מרכזים כל כפתור במסגרת colWidth
      const x = colX + Math.round((colWidth - btn.width) / 2);
      btn.container.x = x;
      btn.container.y = cy;
      cy += btn.height + gap;
    });

    // טקסטים משמאל למעלה
    bannerText.x = pad; bannerText.y = pad;
    bottomText.x = pad; bottomText.y = bannerText.y + bannerText.height + 6;
    resultText.x = pad; resultText.y = bottomText.y + bottomText.height + 6;
  }
  layout();
  window.addEventListener("resize", layout);

  // ----- Wiring -----
  rollBtn.onClick(async () => {          // ← הוספנו אנימציה לפני הגלגול
    await dice.shake(600);
    onRoll?.();
  });
  endBtn.onClick(() => onEndTurn?.());
  buildRoadBtn.onClick(() => onBuildRoad?.());
  buildSettlementBtn.onClick(() => onBuildSettlement?.());
  buildCityBtn.onClick(() => onBuildCity?.());
  tradeBtn.onClick(() => onTrade?.());

  // ----- API -----
  function setBanner(t){ bannerText.text = t; }
  function setBottom(t){ bottomText.text = t; }
  function showResult(t){ resultText.text = t; }

  function setRollEnabled(en){ rollBtn.setEnabled(en); if (!en) dice.clear(); }
  function setEndEnabled(en){ endBtn.setEnabled(en); }
  function setBuildRoadEnabled(en){ buildRoadBtn.setEnabled(en); }
  function setBuildSettlementEnabled(en){ buildSettlementBtn.setEnabled(en); }
  function setBuildCityEnabled(en){ buildCityBtn.setEnabled(en); }
  function setTradeEnabled(en){ tradeBtn.setEnabled(en); }

  return {
    container: hud,
    layout,
    dice,
    setBanner, setBottom, showResult,
    setRollEnabled, setEndEnabled,
    setBuildRoadEnabled, setBuildSettlementEnabled, setBuildCityEnabled,
    setTradeEnabled,
  };
}
