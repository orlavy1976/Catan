// Development cards: buy, reveal, play
// Deck: Knight×14, VP×5, Year of Plenty×2, Monopoly×2, Road Building×2
const DECK_DEF = [
  ...Array(14).fill("knight"),
  ...Array(5).fill("vp"),
  ...Array(2).fill("year_of_plenty"),
  ...Array(2).fill("monopoly"),
  ...Array(2).fill("road_building"),
];

import { patch } from "./stateStore.js";

export function initDevDeck(state, rng = Math) {
  if (!state.devDeck || !Array.isArray(state.devDeck) || state.devDeck.length === 0) {
    const deck = [...DECK_DEF];
    // Fisher–Yates
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor((rng.random ? rng.random() : Math.random()) * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    state.devDeck = deck;
  }
  // ודא לכל שחקן מפת dev + devNew (קלפים שנקנו בתור הנוכחי)
  state.players.forEach(p => {
    p.dev ??= { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
    p.devNew ??= { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
    p.knightsPlayed ??= 0; // לשימוש ל-Largest Army
  });
}

const COST = { ore:1, wheat:1, sheep:1 };

function canPay(res, cost){ return Object.keys(cost).every(k => (res[k] || 0) >= cost[k]); }
function pay(res, cost){ for (const k in cost) res[k] -= cost[k]; }

export function startBuyDevCard({ app, hud, state, resPanel }) {
  if (state.phase !== "play") { hud.showResult("You can only buy a development card on your turn."); return; }
  initDevDeck(state);

  const me = state.players[state.currentPlayer - 1];
  if (!canPay(me.resources, COST)) { hud.showResult("Need 1 ore, 1 wheat, 1 sheep."); return; }
  if (!state.devDeck?.length) { hud.showResult("Development deck is empty."); return; }

  pay(me.resources, COST);
  const card = state.devDeck.pop();

  // עדכון יד
  me.dev[card] = (me.dev[card] || 0) + 1;
  me.devNew[card] = (me.devNew[card] || 0) + 1; // מסמן “נקנה בתור הזה”

  resPanel?.updateResources?.(state.players);
  showDevReveal({ app, card, onClose: () => hud.showResult(`You received: ${pretty(card)}`) });
}

/* =========================
   PLAY DEV – main entry
   ========================= */
export function startPlayDev({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder }) {
  if (state.phase !== "play") return;

  const me = state.players[state.currentPlayer - 1];
  const playable = playableDevCounts(me); // לא כולל VP ולא כולל קלפים שנקנו בתור הזה
  const totalPlayable = Object.values(playable).reduce((a,b)=>a+b,0);
  if (totalPlayable === 0) { hud.showResult("No development cards available to play."); return; }

  // UI: בחירת סוג קלף לשחק
  const overlay = new PIXI.Container(); overlay.zIndex = 10000;
  const dim = new PIXI.Graphics(); dim.beginFill(0x000000, 0.5).drawRect(0,0,app.renderer.width, app.renderer.height).endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container(); overlay.addChild(panel);
  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.96).drawRoundedRect(0,0,560,340,16).endFill();
  bg.lineStyle({ width:2, color:0xffffff, alpha:0.18 }).drawRoundedRect(0,0,560,340,16);
  panel.addChild(bg);

  const title = new PIXI.Text("Play Development Card", { fontFamily:"Georgia, serif", fontSize:22, fill:0xffffff });
  title.x = 20; title.y = 14; panel.addChild(title);

  const list = [
    ["knight","Knight"],
    ["road_building","Road Building"],
    ["year_of_plenty","Year of Plenty"],
    ["monopoly","Monopoly"],
  ];
  let picked = null;

  let y = 58;
  list.forEach(([key, label]) => {
    const qty = playable[key] || 0;
    const row = new PIXI.Container(); panel.addChild(row);
    const cardFace = drawDevCardFace(key); cardFace.x = 20; cardFace.y = y; row.addChild(cardFace);

    const name = new PIXI.Text(`${label}  ${qty>0?`(x${qty})`:"(—)"}`, { fontFamily:"Georgia, serif", fontSize:18, fill:0xffffaa });
    name.x = 132; name.y = y+6; row.addChild(name);

    const desc = new PIXI.Text(prettyDesc(key), { fontFamily:"Arial", fontSize:13, fill:0xdddddd, wordWrap:true, wordWrapWidth:360 });
    desc.x = 132; desc.y = y+32; row.addChild(desc);

    const btn = makeBigButton("Use", () => { if (qty>0){ setPicked(key); } });
    btn.x = 460; btn.y = y+24; row.addChild(btn);

    if (qty === 0) btn.alpha = 0.4;

    y += 70;
  });

  const useBtn = makeBigButton("Play", () => {
    if (!picked) return;
    // צריכה מיידית של הקלף
    me.dev[picked]--;
    close();

    switch (picked) {
      case "knight":
        playKnight({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout });
        break;
      case "road_building":
        playRoadBuilding({ app, hud, state, boardC, graph, builder });
        break;
      case "year_of_plenty":
        playYearOfPlenty({ app, hud, state, resPanel });
        break;
      case "monopoly":
        playMonopoly({ app, hud, state, resPanel });
        break;
    }
  });
  useBtn.x = 320; useBtn.y = 294; panel.addChild(useBtn);

  const cancel = makeBigButton("Cancel", () => close());
  cancel.x = 200; cancel.y = 294; panel.addChild(cancel);

  function setPicked(k){ picked = k; hud.showResult(`Selected: ${pretty(k)}`); }
  function close(){
    app.stage.removeChild(overlay);
    // השבת כפתורים
    hud.setEndEnabled(true);
    hud.setBuildRoadEnabled(true);
    hud.setBuildSettlementEnabled(true);
    hud.setBuildCityEnabled(true);
    hud.setTradeEnabled(true);
    hud.setBuyDevEnabled(true);
    hud.setPlayDevEnabled(true);
  }

  panel.x = (app.renderer.width - 560) / 2;
  panel.y = (app.renderer.height - 340) / 2;

  // נטרל HUD בזמן הדיאלוג
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);
  hud.setBuyDevEnabled(false);
  hud.setPlayDevEnabled(false);

  app.stage.addChild(overlay);
}

/* ====== Card effects ====== */

// Knight: הזזת השודד + גניבה + עדכון Largest Army
function playKnight({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout }) {
  const { enterRobberMove } = require("../game/robber.js"); // הימנעות ממעגליות ייבוא

  // 1) עדכן מונה אבירים + בעל Largest Army בתוך patch כדי לטריגר subscribe/ScorePanel
  const meIdx = state.currentPlayer - 1;
  patch(s => {
    const me = s.players[meIdx];
    me.knightsPlayed = (me.knightsPlayed || 0) + 1;
    // חישוב Largest Army: מינ' 3 וללא תיקו
    const ks = s.players.map(p => p?.knightsPlayed || 0);
    let bestIdx = null, bestVal = -1, tie = false;
    for (let i = 0; i < ks.length; i++) {
      const v = ks[i];
      if (v > bestVal) { bestVal = v; bestIdx = i; tie = false; }
      else if (v === bestVal) { tie = true; }
    }
    s.largestArmyOwner = (bestVal >= 3 && !tie) ? bestIdx : null;
  });

  // 2) מעבר למצב הזזת שודד (כולל גניבה) – ממחזר את ה-flow של 7
  state.phase = "move-robber";
  hud.showResult("Knight played — move the robber and steal 1 resource.");
  hud.setBottom("Click a tile to move the robber");
  hud.setRollEnabled(false);
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);
  hud.setBuyDevEnabled(false);
  hud.setPlayDevEnabled(false);

  enterRobberMove(
    { app, boardC, hud, state, tileSprites, robberSpriteRef, graph, layout, resPanel },
    () => {
      // 3) חזרה ל-play לאחר הזזה וגניבה
      state.phase = "play";
      hud.setBottom("You may build, trade, or end the turn");
      hud.setRollEnabled(false);
      hud.setEndEnabled(true);
      hud.setBuildRoadEnabled(true);
      hud.setBuildSettlementEnabled(true);
      hud.setBuildCityEnabled(true);
      hud.setTradeEnabled(true);
      hud.setBuyDevEnabled(true);
      hud.setPlayDevEnabled(true);
      hud.showResult("Robber moved.");
      // רענון לוח משאבים אם הגניבה שינתה ידיים
      resPanel?.updateResources?.(state.players);
    }
  );
}

// Road Building: placeholder – נשאר כמו לפני (שני כבישים בחינם)
function playRoadBuilding({ app, hud, state, boardC, graph, builder }) {
  const { startBuildRoad } = require("./buildRoad.js");
  let remaining = 2;

  hud.showResult("Road Building — place 2 roads for free.");
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);
  hud.setBuyDevEnabled(false);
  hud.setPlayDevEnabled(false);

  const placeNext = () => {
    if (remaining <= 0) {
      hud.setEndEnabled(true);
      hud.setBuildRoadEnabled(true);
      hud.setBuildSettlementEnabled(true);
      hud.setBuildCityEnabled(true);
      hud.setTradeEnabled(true);
      hud.setBuyDevEnabled(true);
      hud.setPlayDevEnabled(true);
      hud.showResult("Road Building complete.");
      return;
    }
    startBuildRoad(
      { app, boardC, hud, state, graph, builder },
      {
        free: true,
        onPlaced: () => { remaining--; placeNext(); },
        onCancel: () => { remaining = 0; placeNext(); }
      }
    );
  };
  placeNext();
}

// Year of Plenty
function playYearOfPlenty({ app, hud, state, resPanel }) {
  const RES = ["brick","wood","wheat","sheep","ore"];
  const overlay = new PIXI.Container(); overlay.zIndex = 10000;
  const dim = new PIXI.Graphics(); dim.beginFill(0x000000, 0.5).drawRect(0,0,app.renderer.width, app.renderer.height).endFill();
  overlay.addChild(dim);
  const panel = new PIXI.Container(); overlay.addChild(panel);

  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.96).drawRoundedRect(0,0,480,260,16).endFill();
  bg.lineStyle({ width:2, color:0xffffff, alpha:0.18 }).drawRoundedRect(0,0,480,260,16);
  panel.addChild(bg);

  const title = new PIXI.Text("Year of Plenty — pick 2 resources", { fontFamily:"Georgia, serif", fontSize:20, fill:0xffffff });
  title.x = 20; title.y = 14; panel.addChild(title);

  let picks = [];
  RES.forEach((k,i) => {
    const c = makeChip(k, () => {
      if (picks.length >= 2) return;
      picks.push(k);
      hud.showResult(`Picked: ${picks.join(", ")}`);
    });
    c.container.x = 20 + i*90; c.container.y = 80;
    panel.addChild(c.container);
  });

  const confirm = makeBigButton("Confirm", () => {
    if (picks.length < 2) { hud.showResult("Pick two resources."); return; }
    const me = state.players[state.currentPlayer - 1];
    picks.forEach(k => { me.resources[k] = (me.resources[k]||0)+1; });
    resPanel?.updateResources?.(state.players);
    close();
    hud.showResult(`Year of Plenty: +1 ${picks[0]}, +1 ${picks[1]}`);
  });
  confirm.x = 340; confirm.y = 210; panel.addChild(confirm);

  const cancel = makeBigButton("Cancel", () => { close(); });
  cancel.x = 220; cancel.y = 210; panel.addChild(cancel);

  function close(){ app.stage.removeChild(overlay); }
  panel.x = (app.renderer.width - 480) / 2;
  panel.y = (app.renderer.height - 260) / 2;
  app.stage.addChild(overlay);
}

// Monopoly
function playMonopoly({ app, hud, state, resPanel }) {
  const RES = ["brick","wood","wheat","sheep","ore"];
  const overlay = new PIXI.Container(); overlay.zIndex = 10000;
  const dim = new PIXI.Graphics(); dim.beginFill(0x000000, 0.5).drawRect(0,0,app.renderer.width, app.renderer.height).endFill();
  overlay.addChild(dim);
  const panel = new PIXI.Container(); overlay.addChild(panel);

  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.96).drawRoundedRect(0,0,480,220,16).endFill();
  bg.lineStyle({ width:2, color:0xffffff, alpha:0.18 }).drawRoundedRect(0,0,480,220,16);
  panel.addChild(bg);

  const title = new PIXI.Text("Monopoly — choose a resource", { fontFamily:"Georgia, serif", fontSize:20, fill:0xffffff });
  title.x = 20; title.y = 14; panel.addChild(title);

  let chosen = null;
  RES.forEach((k,i) => {
    const c = makeChip(k, () => { chosen = k; hud.showResult(`Monopoly: ${k}`); });
    c.container.x = 20 + i*90; c.container.y = 80;
    panel.addChild(c.container);
  });

  const confirm = makeBigButton("Confirm", () => {
    if (!chosen) { hud.showResult("Pick a resource."); return; }
    const meIdx = state.currentPlayer - 1;
    const me = state.players[meIdx];
    let taken = 0;
    state.players.forEach((p,i) => {
      if (i === meIdx) return;
      const amt = p.resources[chosen] || 0;
      if (amt > 0) {
        p.resources[chosen] -= amt;
        me.resources[chosen] = (me.resources[chosen]||0) + amt;
        taken += amt;
      }
    });
    resPanel?.updateResources?.(state.players);
    close();
    hud.showResult(`Monopoly: took ${taken} ${chosen} from others`);
  });
  confirm.x = 340; confirm.y = 170; panel.addChild(confirm);

  const cancel = makeBigButton("Cancel", () => close());
  cancel.x = 220; cancel.y = 170; panel.addChild(cancel);

  function close(){ app.stage.removeChild(overlay); }
  panel.x = (app.renderer.width - 480) / 2;
  panel.y = (app.renderer.height - 220) / 2;
  app.stage.addChild(overlay);
}

/* ========= Reveal overlay (buy) ========= */
function showDevReveal({ app, card, onClose }) {
  const overlay = new PIXI.Container();
  overlay.zIndex = 10000;

  const dim = new PIXI.Graphics();
  dim.beginFill(0x000000, 0.55);
  dim.drawRect(0, 0, app.renderer.width, app.renderer.height);
  dim.endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container();
  overlay.addChild(panel);

  const bg = new PIXI.Graphics();
  bg.beginFill(0x111827, 0.98);
  bg.drawRoundedRect(0, 0, 420, 220, 16);
  bg.endFill();
  bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.15 });
  bg.drawRoundedRect(0, 0, 420, 220, 16);
  panel.addChild(bg);

  const title = new PIXI.Text("Development Card", { fontFamily: "Georgia, serif", fontSize: 22, fill: 0xffffff });
  title.x = 20; title.y = 16; panel.addChild(title);

  const cardC = drawDevCardFace(card); cardC.x = 28; cardC.y = 60; panel.addChild(cardC);

  const name = new PIXI.Text(pretty(card), { fontFamily: "Georgia, serif", fontSize: 20, fill: 0xffffaa });
  name.x = 140; name.y = 70; panel.addChild(name);

  const desc = new PIXI.Text(prettyDesc(card), { fontFamily: "Arial", fontSize: 14, fill: 0xdddddd, wordWrap: true, wordWrapWidth: 240 });
  desc.x = 140; desc.y = 104; panel.addChild(desc);

  const ok = makeBigButton("OK", () => close());
  ok.x = 290; ok.y = 174; panel.addChild(ok);

  panel.x = (app.renderer.width - 420) / 2;
  panel.y = (app.renderer.height - 220) / 2;

  function close(){ app.stage.removeChild(overlay); onClose?.(); }
  app.stage.addChild(overlay);
}

/* ========= Helpers & UI bits ========= */
function playableDevCounts(player) {
  const d = player.dev || {};
  const n = player.devNew || {};
  return {
    knight: Math.max(0, (d.knight||0) - (n.knight||0)),
    road_building: Math.max(0, (d.road_building||0) - (n.road_building||0)),
    year_of_plenty: Math.max(0, (d.year_of_plenty||0) - (n.year_of_plenty||0)),
    monopoly: Math.max(0, (d.monopoly||0) - (n.monopoly||0)),
  };
}

function drawDevCardFace(cardKey) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0xfef3c7).drawRoundedRect(0, 0, 96, 130, 10).endFill();
  g.lineStyle(2, 0x111827, 0.6).drawRoundedRect(0, 0, 96, 130, 10);
  c.addChild(g);

  const icon = new PIXI.Graphics(); icon.x = 48; icon.y = 46;
  switch (cardKey) {
    case "knight": icon.lineStyle(3,0x1f2937,1); icon.moveTo(-18,-18).lineTo(18,18); icon.moveTo(-10,-6).lineTo(-2,2); icon.moveTo(6,10).lineTo(12,16); break;
    case "road_building": icon.lineStyle(3,0x1f2937,1); icon.moveTo(-24,0).lineTo(24,0); icon.moveTo(-24,-8).lineTo(0,-8); icon.moveTo(4,-8).lineTo(24,-8); break;
    case "year_of_plenty": icon.beginFill(0x1f2937,1).drawPolygon([-18,10, 0,-16, 18,10]).endFill(); break;
    case "monopoly": icon.lineStyle(3,0x1f2937,1).drawCircle(0,0,20); break;
    case "vp": icon.beginFill(0x1f2937,1).drawPolygon([-18,8,-10,-12,0,8,10,-12,18,8]).endFill(); break;
  }
  c.addChild(icon);

  const t = new PIXI.Text(shortKey(cardKey), { fontFamily:"Arial", fontSize: 12, fill: 0x111827 });
  t.anchor.set(0.5, 0); t.x = 48; t.y = 92; c.addChild(t);
  return c;
}

function shortKey(k) {
  return ({ knight:"Knight", vp:"Victory", year_of_plenty:"Year of Plenty", monopoly:"Monopoly", road_building:"Road Building" })[k] || k;
}
function pretty(k) {
  return ({ knight:"Knight", vp:"Victory Point", year_of_plenty:"Year of Plenty", monopoly:"Monopoly", road_building:"Road Building" })[k] || k;
}
function prettyDesc(k) {
  return ({
    knight: "Move the robber and steal 1 resource.",
    vp: "Keep hidden. Worth 1 victory point.",
    year_of_plenty: "Take any 2 resources from the bank.",
    monopoly: "Choose a resource; all players give you that resource.",
    road_building: "Build 2 roads for free.",
  })[k] || "";
}

function makeBigButton(label, onClick) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0x2563eb, 1).drawRoundedRect(0, 0, 140, 36, 8).endFill();
  g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.25 }).drawRoundedRect(0, 0, 140, 36, 8);
  c.addChild(g);
  const t = new PIXI.Text(label, { fontFamily:"Arial", fontSize:14, fill:0xffffff }); t.x = 10; t.y = 8; c.addChild(t);
  c.eventMode = "static"; c.cursor = "pointer"; c.on("pointertap", onClick);
  return c;
}

function makeChip(label, onClick) {
  const container = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0xffffff, 0.12).drawRoundedRect(0,0,88,32,10).endFill();
  g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.35 }).drawRoundedRect(0,0,88,32,10);
  container.addChild(g);
  const t = new PIXI.Text(label, { fontFamily:"Arial", fontSize:14, fill:0xffffff }); t.x = 10; t.y = 8; container.addChild(t);
  container.eventMode = "static"; container.cursor = "pointer"; container.on("pointertap", onClick);
  return { container };
}
