// Public API: initDevDeck, startBuyDevCard, startPlayDev
import { drawDevCardFace, pretty, prettyDesc, makeBigButton } from "./ui.js";
import { playKnight } from "./effects/knight.js";
import { playRoadBuilding } from "./effects/roadBuilding.js";
import { playYearOfPlenty } from "./effects/yearOfPlenty.js";
import { playMonopoly } from "./effects/monopoly.js";

import { startBuildRoad } from "../buildRoad.js";
import { enterRobberMove } from "../robber.js";

const DECK_DEF = [
  ...Array(14).fill("knight"),
  ...Array(5).fill("vp"),
  ...Array(2).fill("year_of_plenty"),
  ...Array(2).fill("monopoly"),
  ...Array(2).fill("road_building"),
];

export function initDevDeck(state, rng = Math) {
  if (!state.devDeck || !Array.isArray(state.devDeck) || state.devDeck.length === 0) {
    const deck = [...DECK_DEF];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor((rng.random ? rng.random() : Math.random()) * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    state.devDeck = deck;
  }
  state.players.forEach(p => {
    p.dev ??= { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
    p.devNew ??= { knight:0, vp:0, year_of_plenty:0, monopoly:0, road_building:0 };
    p.knightsPlayed ??= 0;
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
  me.dev[card] = (me.dev[card] || 0) + 1;
  me.devNew[card] = (me.devNew[card] || 0) + 1;

  resPanel?.updateResources?.(state.players);
  showDevReveal({ app, card, onClose: () => hud.showResult(`You received: ${pretty(card)}`) });
}

export function startPlayDev({ app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder }) {
  if (state.phase !== "play") return;

  const me = state.players[state.currentPlayer - 1];
  const playable = playableDevCounts(me);
  const totalPlayable = Object.values(playable).reduce((a,b)=>a+b,0);
  if (totalPlayable === 0) { hud.showResult("No development cards available to play."); return; }

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

    const btn = makeBigButton("Use", () => { if (qty>0){ picked = key; hud.showResult(`Selected: ${label}`); } });
    btn.x = 460; btn.y = y+24; row.addChild(btn);
    if (qty === 0) btn.alpha = 0.4;

    y += 70;
  });

  const playBtn = makeBigButton("Play", () => {
    if (!picked) return;
    me.dev[picked]--;
    close();

    const deps = { app, hud, state, resPanel, boardC, tileSprites, robberSpriteRef, graph, layout, builder,
      // pass concrete actions to avoid circular deps from inside effects:
      enterRobberMove, startBuildRoad
    };

    if (picked === "knight") return playKnight(deps);
    if (picked === "road_building") return playRoadBuilding(deps);
    if (picked === "year_of_plenty") return playYearOfPlenty(deps);
    if (picked === "monopoly") return playMonopoly(deps);
  });
  playBtn.x = 320; playBtn.y = 294; panel.addChild(playBtn);

  const cancel = makeBigButton("Cancel", () => close());
  cancel.x = 200; cancel.y = 294; panel.addChild(cancel);

  panel.x = (app.renderer.width - 560) / 2;
  panel.y = (app.renderer.height - 340) / 2;

  // נטרל HUD בזמן הדיאלוג
  toggleHud(hud, false);
  app.stage.addChild(overlay);

  function close(){
    app.stage.removeChild(overlay);
    toggleHud(hud, true);
  }
}

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

function showDevReveal({ app, card, onClose }) {
  const overlay = new PIXI.Container(); overlay.zIndex = 10000;
  const dim = new PIXI.Graphics(); dim.beginFill(0x000000, 0.55).drawRect(0,0,app.renderer.width, app.renderer.height).endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container(); overlay.addChild(panel);
  const bg = new PIXI.Graphics();
  bg.beginFill(0x111827, 0.98).drawRoundedRect(0, 0, 420, 220, 16).endFill();
  bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.15 }).drawRoundedRect(0, 0, 420, 220, 16);
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

function toggleHud(hud, on) {
  hud.setRollEnabled(false);
  hud.setEndEnabled(on);
  hud.setBuildRoadEnabled(on);
  hud.setBuildSettlementEnabled(on);
  hud.setBuildCityEnabled(on);
  hud.setTradeEnabled(on);
  hud.setBuyDevEnabled(on);
  hud.setPlayDevEnabled(on);
}
