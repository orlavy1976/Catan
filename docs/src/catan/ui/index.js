import { makeButton } from "./button.js";
import { makeDiceView } from "./diceView.js";

export function createHUD(app, root, onRoll, onEndTurn, onBuildRoad, onBuildSettlement, onBuildCity, onTrade, onBuyDev, onPlayDev) {
  const hud = new PIXI.Container();
  root.addChild(hud);

  // layout constants
  const pad = 20;
  const gap = 10;
  const gapLarge = 14;
  const colWidth = 200;

  // ----- Buttons -----
  const rollBtn = makeButton("Roll Dice", 160);
  const buildSettlementBtn = makeButton("Build Settlement", 200);
  const buildRoadBtn = makeButton("Build Road", 160);
  const buildCityBtn = makeButton("Build City", 160);
  const tradeBtn = makeButton("Trade", 140);
  const buyDevBtn = makeButton("Buy Dev Card", 160);
  const playDevBtn = makeButton("Play Dev", 140);
  const endBtn = makeButton("End Turn", 160);

  const colButtons = [
    rollBtn,
    buildSettlementBtn,
    buildRoadBtn,
    buildCityBtn,
    tradeBtn,
    buyDevBtn,
    playDevBtn,
    endBtn
  ];
  colButtons.forEach(b => hud.addChild(b.container));

  // ----- Dice -----
  const dice = makeDiceView();
  hud.addChild(dice.container);

  // ----- Texts -----
  const bannerStyle = new PIXI.TextStyle({ fontFamily: "Georgia, serif", fontSize: 22, fill: 0xffffff, stroke: 0x000000, strokeThickness: 4 });
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
    const colX = app.renderer.width - pad - colWidth;
    let cy = pad;

    const diceW = 150;
    dice.container.x = colX + Math.round((colWidth - diceW) / 2);
    dice.container.y = cy;
    cy += 120 + gapLarge;

    colButtons.forEach(btn => {
      const x = colX + Math.round((colWidth - btn.width) / 2);
      btn.container.x = x;
      btn.container.y = cy;
      cy += btn.height + gap;
    });

    bannerText.x = pad; bannerText.y = pad;
    bottomText.x = pad; bottomText.y = bannerText.y + bannerText.height + 6;
    resultText.x = pad; resultText.y = bottomText.y + bottomText.height + 6;
  }
  layout();
  window.addEventListener("resize", layout);

  // ----- Wiring -----
  rollBtn.onClick(async () => {
    await dice.shake(600);
    onRoll?.();
  });
  endBtn.onClick(() => onEndTurn?.());
  buildRoadBtn.onClick(() => onBuildRoad?.());
  buildSettlementBtn.onClick(() => onBuildSettlement?.());
  buildCityBtn.onClick(() => onBuildCity?.());
  tradeBtn.onClick(() => onTrade?.());
  buyDevBtn.onClick(() => onBuyDev?.());
  playDevBtn.onClick(() => onPlayDev?.()); // בשלב הבא נממש

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
  function setBuyDevEnabled(en){ buyDevBtn.setEnabled(en); }
  function setPlayDevEnabled(en){ playDevBtn.setEnabled(en); }

  return {
    container: hud,
    layout,
    dice,
    setBanner, setBottom, showResult,
    setRollEnabled, setEndEnabled,
    setBuildRoadEnabled, setBuildSettlementEnabled, setBuildCityEnabled,
    setTradeEnabled, setBuyDevEnabled, setPlayDevEnabled,
  };
}
