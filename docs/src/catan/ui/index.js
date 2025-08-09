import { makeButton } from "./button.js";
import { makeDiceView } from "./diceView.js";

export function createHUD(app, root, onRoll, onEndTurn, onBuildRoad, onBuildSettlement, onBuildCity, onTrade) {
  const hud = new PIXI.Container();
  root.addChild(hud);

  const pad = 20;
  const gap = 10;

  // ----- Buttons -----
  const rollBtn = makeButton("Roll Dice", 140);
  const buildSettlementBtn = makeButton("Build Settlement", 200);
  const buildRoadBtn = makeButton("Build Road", 140);
  const buildCityBtn = makeButton("Build City", 140);
  const tradeBtn = makeButton("Trade", 120);
  const endBtn = makeButton("End Turn", 140);

  [rollBtn, buildSettlementBtn, buildRoadBtn, buildCityBtn, tradeBtn, endBtn].forEach(b => hud.addChild(b.container));

  // Dice
  const dice = makeDiceView();
  hud.addChild(dice.container);

  // Texts
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
    // סדר מימין לשמאל: End | Trade | City | Road | Settlement | Roll
    let x = app.renderer.width - pad;

    endBtn.container.x = x - endBtn.width; endBtn.container.y = pad; x = endBtn.container.x - gap;
    tradeBtn.container.x = x - tradeBtn.width; tradeBtn.container.y = pad; x = tradeBtn.container.x - gap;
    buildCityBtn.container.x = x - buildCityBtn.width; buildCityBtn.container.y = pad; x = buildCityBtn.container.x - gap;
    buildRoadBtn.container.x = x - buildRoadBtn.width; buildRoadBtn.container.y = pad; x = buildRoadBtn.container.x - gap;
    buildSettlementBtn.container.x = x - buildSettlementBtn.width; buildSettlementBtn.container.y = pad; x = buildSettlementBtn.container.x - gap;
    rollBtn.container.x = x - rollBtn.width; rollBtn.container.y = pad;

    // קוביות מעט משמאל ל-Roll
    dice.container.x = rollBtn.container.x - 160;
    dice.container.y = pad;

    // טקסטים משמאל
    bannerText.x = pad; bannerText.y = pad;
    bottomText.x = pad; bottomText.y = bannerText.y + bannerText.height + 6;
    resultText.x = pad; resultText.y = bottomText.y + bottomText.height + 6;
  }
  layout();
  window.addEventListener("resize", layout);

  // ----- Wiring -----
  rollBtn.onClick(() => onRoll?.());
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
