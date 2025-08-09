import { RES_KEYS } from "../config/constants.js";

/* ===============================================
   Trade Menu (Bank vs Players)
   =============================================== */
export function startTradeMenu({ app, hud, state, resPanel, graph }) {
  const overlay = new PIXI.Container();
  overlay.zIndex = 10000;

  const dim = new PIXI.Graphics();
  dim.beginFill(0x000000, 0.5);
  dim.drawRect(0, 0, app.renderer.width, app.renderer.height);
  dim.endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container();
  overlay.addChild(panel);

  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.96);
  bg.drawRoundedRect(0, 0, 420, 170, 16);
  bg.endFill();
  bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.18 });
  bg.drawRoundedRect(0, 0, 420, 170, 16);
  panel.addChild(bg);

  const title = new PIXI.Text("Choose Trade Type", { fontFamily: "Georgia, serif", fontSize: 22, fill: 0xffffff });
  title.x = 20; title.y = 14;
  panel.addChild(title);

  const btnBank = makeBigButton("Bank / Port", () => {
    close();
    startBankTrade({ app, hud, state, resPanel, graph });
  });
  btnBank.x = 40; btnBank.y = 90; panel.addChild(btnBank);

  const btnPlayers = makeBigButton("Players", () => {
    close();
    startPlayerTrade({ app, hud, state, resPanel });
  });
  btnPlayers.x = 220; btnPlayers.y = 90; panel.addChild(btnPlayers);

  const btnCancel = makeSmallLink("Cancel", () => close());
  btnCancel.x = 360; btnCancel.y = 140; panel.addChild(btnCancel);

  panel.x = (app.renderer.width - 420) / 2;
  panel.y = (app.renderer.height - 170) / 2;

  // disable other HUD while open
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);

  function close() {
    app.stage.removeChild(overlay);
    hud.setEndEnabled(true);
    hud.setBuildRoadEnabled(true);
    hud.setBuildSettlementEnabled(true);
    hud.setBuildCityEnabled(true);
    hud.setTradeEnabled(true);
  }

  app.stage.addChild(overlay);
}

/* ===============================================
   Bank / Port Trade (קיים, נשמר; הוסף תמיכה בנמלים)
   =============================================== */
export function startBankTrade({ app, hud, state, resPanel, graph }) {
  const overlay = new PIXI.Container();
  overlay.zIndex = 10000;

  const dim = new PIXI.Graphics();
  dim.beginFill(0x000000, 0.5);
  dim.drawRect(0, 0, app.renderer.width, app.renderer.height);
  dim.endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container();
  overlay.addChild(panel);

  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.95);
  bg.drawRoundedRect(0, 0, 560, 300, 16);
  bg.endFill();
  bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.2 });
  bg.drawRoundedRect(0, 0, 560, 300, 16);
  panel.addChild(bg);

  const title = new PIXI.Text("Bank / Port Trade", { fontFamily: "Georgia, serif", fontSize: 22, fill: 0xffffff });
  title.x = 20; title.y = 16;
  panel.addChild(title);

  const status = new PIXI.Text("", { fontFamily: "Arial", fontSize: 16, fill: 0xffffaa });
  status.x = 20; status.y = 54;
  panel.addChild(status);

  let give = "brick";
  let get = "wheat";
  let mult = 1;

  const rates = computeEffectiveRatesForCurrentPlayer(state, graph);
  const hint = new PIXI.Text("", { fontFamily: "Arial", fontSize: 13, fill: 0xdddddd, wordWrap: true, wordWrapWidth: 520 });
  hint.x = 20; hint.y = 78;
  panel.addChild(hint);

  function updateStatus() {
    const rate = rates[give] ?? 4;
    status.text = `Give ${rate*mult} × ${give}  →  Get ${mult} × ${get}   (rate ${rate}:1)`;
    hint.text = `Your port rates: ${formatRates(rates)}`;
  }
  updateStatus();

  const giveLabel = new PIXI.Text("Give:", { fontFamily: "Arial", fontSize: 16, fill: 0xffffff });
  giveLabel.x = 20; giveLabel.y = 110; panel.addChild(giveLabel);
  makeResourceButtons(RES_KEYS, (k) => { give = k; updateStatus(); }, 20, 134).forEach(b => panel.addChild(b));

  const getLabel = new PIXI.Text("Get:", { fontFamily: "Arial", fontSize: 16, fill: 0xffffff });
  getLabel.x = 20; getLabel.y = 192; panel.addChild(getLabel);
  makeResourceButtons(RES_KEYS, (k) => { get = k; updateStatus(); }, 20, 216).forEach(b => panel.addChild(b));

  const multLabel = new PIXI.Text("x", { fontFamily: "Arial", fontSize: 18, fill: 0xffffff });
  multLabel.x = 370; multLabel.y = 136; panel.addChild(multLabel);

  const multText = new PIXI.Text(`${mult}`, { fontFamily: "Georgia, serif", fontSize: 24, fill: 0xffffff });
  multText.x = 390; multText.y = 130; panel.addChild(multText);

  const plus = makeMiniButton("+", () => { mult++; updateStatus(); multText.text = `${mult}`; });
  plus.x = 430; plus.y = 56; panel.addChild(plus);

  const minus = makeMiniButton("−", () => { mult = Math.max(1, mult-1); updateStatus(); multText.text = `${mult}`; });
  minus.x = 470; minus.y = 56; panel.addChild(minus);

  const confirm = makeBigButton("Confirm", () => {
    const me = state.players[state.currentPlayer - 1];
    const rate = rates[give] ?? 4;
    const need = rate * mult;
    if ((me.resources[give] || 0) < need) {
      hud.showResult(`Not enough ${give} (need ${need} for rate ${rate}:1).`);
      return;
    }
    me.resources[give] -= need;
    me.resources[get] = (me.resources[get] || 0) + mult;

    resPanel?.updateResources?.(state.players);
    hud.showResult(`Trade ${rate}:1 — -${need} ${give}  +${mult} ${get}`);
    close();
  });
  confirm.x = 320; confirm.y = 258; panel.addChild(confirm);

  const cancel = makeBigButton("Cancel", () => close());
  cancel.x = 200; cancel.y = 258; panel.addChild(cancel);

  function close() {
    app.stage.removeChild(overlay);
    hud.setEndEnabled(true);
    hud.setBuildRoadEnabled(true);
    hud.setBuildSettlementEnabled(true);
    hud.setBuildCityEnabled(true);
    hud.setTradeEnabled(true);
  }

  panel.x = (app.renderer.width - 560) / 2;
  panel.y = (app.renderer.height - 300) / 2;

  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);

  app.stage.addChild(overlay);
}

/* ===============================================
   Player-to-Player Trade
   =============================================== */
export function startPlayerTrade({ app, hud, state, resPanel }) {
  const meIdx = state.currentPlayer - 1;
  const players = state.players;
  const others = players.map((p,i)=>({p,i})).filter(({i}) => i !== meIdx);

  const overlay = new PIXI.Container(); overlay.zIndex = 10000;
  const dim = new PIXI.Graphics();
  dim.beginFill(0x000000, 0.5); dim.drawRect(0,0,app.renderer.width, app.renderer.height); dim.endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container(); overlay.addChild(panel);
  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.96); bg.drawRoundedRect(0,0,640,380,16); bg.endFill();
  bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.18 }); bg.drawRoundedRect(0,0,640,380,16);
  panel.addChild(bg);

  const title = new PIXI.Text("Player Trade", { fontFamily: "Georgia, serif", fontSize: 22, fill: 0xffffff });
  title.x = 20; title.y = 14; panel.addChild(title);

  const targetLabel = new PIXI.Text("Trade with:", { fontFamily: "Arial", fontSize: 16, fill: 0xffffff });
  targetLabel.x = 20; targetLabel.y = 54; panel.addChild(targetLabel);

  let targetIdx = others.length ? others[0].i : null;

  const targetButtons = [];
  let tx = 120;
  others.forEach(({p,i}) => {
    const b = makeChip(playerLabel(i, players), () => { targetIdx = i; targetButtons.forEach(bb=>bb.setAlpha(0.6)); b.setAlpha(1); });
    b.container.x = tx; b.container.y = 48; tx += b.container.width + 8;
    if (i === targetIdx) b.setAlpha(1); else b.setAlpha(0.6);
    panel.addChild(b.container);
    targetButtons.push(b);
  });

  const columnsLabel = new PIXI.Text("You give                         You get", { fontFamily: "Arial", fontSize: 14, fill: 0xdddddd });
  columnsLabel.x = 20; columnsLabel.y = 92; panel.addChild(columnsLabel);

  // טבלאות הכמויות
  const giveQty = initZeroQtyMap();
  const getQty  = initZeroQtyMap();

  // בניית שורות משאבים: עמודה שמאל (give), עמודה ימין (get)
  let rowY = 116;
  RES_KEYS.forEach(res => {
    const row = new PIXI.Container(); panel.addChild(row);

    // Give side
    const name1 = new PIXI.Text(res, { fontFamily: "Arial", fontSize: 14, fill: 0xffffff });
    name1.x = 20; name1.y = rowY+6; row.addChild(name1);

    const minus1 = makeMiniButton("−", () => { giveQty[res] = Math.max(0, giveQty[res]-1); qty1.text = String(giveQty[res]); });
    minus1.x = 110; minus1.y = rowY; row.addChild(minus1);

    const qty1 = new PIXI.Text("0", { fontFamily: "Georgia, serif", fontSize: 18, fill: 0xffffff });
    qty1.x = 146; qty1.y = rowY+4; row.addChild(qty1);

    const plus1 = makeMiniButton("+", () => { giveQty[res]++; qty1.text = String(giveQty[res]); });
    plus1.x = 178; plus1.y = rowY; row.addChild(plus1);

    // Get side
    const name2 = new PIXI.Text(res, { fontFamily: "Arial", fontSize: 14, fill: 0xffffff });
    name2.x = 330; name2.y = rowY+6; row.addChild(name2);

    const minus2 = makeMiniButton("−", () => { getQty[res] = Math.max(0, getQty[res]-1); qty2.text = String(getQty[res]); });
    minus2.x = 418; minus2.y = rowY; row.addChild(minus2);

    const qty2 = new PIXI.Text("0", { fontFamily: "Georgia, serif", fontSize: 18, fill: 0xffffff });
    qty2.x = 454; qty2.y = rowY+4; row.addChild(qty2);

    const plus2 = makeMiniButton("+", () => { getQty[res]++; qty2.text = String(getQty[res]); });
    plus2.x = 486; plus2.y = rowY; row.addChild(plus2);

    rowY += 42;
  });

  // כפתורים תחתונים
  const sendOffer = makeBigButton("Send Offer", () => {
    if (targetIdx == null) { hud.showResult("Pick a target player."); return; }
    const offer = compactQty(giveQty), want = compactQty(getQty);
    const me = state.players[meIdx];
    // בדיקה ראשונית: יש לי מספיק למה שאני מציע?
    if (!hasAtLeast(me.resources, offer)) {
      hud.showResult("You don't have enough resources for this offer.");
      return;
    }
    // שלב אישור אצל היעד
    close(); // נסגור את מסך העריכה כדי לאפשר ליעד לאשר
    confirmOfferWithTarget({ app, hud, state, resPanel, fromIdx: meIdx, toIdx: targetIdx, offer, want });
  });
  sendOffer.x = 360; sendOffer.y = 330; panel.addChild(sendOffer);

  const cancel = makeBigButton("Cancel", () => close());
  cancel.x = 240; cancel.y = 330; panel.addChild(cancel);

  function close() {
    app.stage.removeChild(overlay);
    hud.setEndEnabled(true);
    hud.setBuildRoadEnabled(true);
    hud.setBuildSettlementEnabled(true);
    hud.setBuildCityEnabled(true);
    hud.setTradeEnabled(true);
  }

  panel.x = (app.renderer.width - 640) / 2;
  panel.y = (app.renderer.height - 380) / 2;

  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);

  app.stage.addChild(overlay);
}

/* ===== Target-side confirmation dialog ===== */
function confirmOfferWithTarget({ app, hud, state, resPanel, fromIdx, toIdx, offer, want }) {
  const overlay = new PIXI.Container(); overlay.zIndex = 10000;
  const dim = new PIXI.Graphics(); dim.beginFill(0x000000, 0.5); dim.drawRect(0,0,app.renderer.width, app.renderer.height); dim.endFill();
  overlay.addChild(dim);

  const panel = new PIXI.Container(); overlay.addChild(panel);
  const bg = new PIXI.Graphics();
  bg.beginFill(0x1f2937, 0.96); bg.drawRoundedRect(0,0,560,300,16); bg.endFill();
  bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.18 }); bg.drawRoundedRect(0,0,560,300,16);
  panel.addChild(bg);

  const title = new PIXI.Text(`Trade Offer: ${playerLabel(fromIdx, state.players)} → ${playerLabel(toIdx, state.players)}`, { fontFamily: "Georgia, serif", fontSize: 20, fill: 0xffffff });
  title.x = 20; title.y = 14; panel.addChild(title);

  const summary = new PIXI.Text(formatOfferSummary(offer, want), { fontFamily: "Arial", fontSize: 16, fill: 0xffffaa, wordWrap: true, wordWrapWidth: 520 });
  summary.x = 20; summary.y = 50; panel.addChild(summary);

  const note = new PIXI.Text(`Accept only if you have the requested cards.`, { fontFamily: "Arial", fontSize: 13, fill: 0xdddddd });
  note.x = 20; note.y = 120; panel.addChild(note);

  const accept = makeBigButton("Accept", () => {
    const from = state.players[fromIdx];
    const to   = state.players[toIdx];

    // אימות בזמן אמת: לשניהם יש מספיק?
    if (!hasAtLeast(from.resources, offer)) { hud.showResult("Offerer no longer has enough resources."); close(); return; }
    if (!hasAtLeast(to.resources,   want )) { hud.showResult("Target doesn't have enough resources to give."); close(); return; }

    // העברת קלפים: from נותן "offer", to נותן "want"
    subResources(from.resources, offer);
    addResources(to.resources,   offer);

    subResources(to.resources,   want);
    addResources(from.resources, want);

    resPanel?.updateResources?.(state.players);
    hud.showResult(`Trade done: ${playerLabel(fromIdx, state.players)} ⇄ ${playerLabel(toIdx, state.players)}`);
    close();
  });
  accept.x = 320; accept.y = 250; panel.addChild(accept);

  const decline = makeBigButton("Decline", () => { close(); hud.showResult("Offer declined."); });
  decline.x = 200; decline.y = 250; panel.addChild(decline);

  function close() {
    app.stage.removeChild(overlay);
    // השבתת כפתורים חוזרת לנקודת המוצא; אין שינוי כאן
    hud.setEndEnabled(true);
    hud.setBuildRoadEnabled(true);
    hud.setBuildSettlementEnabled(true);
    hud.setBuildCityEnabled(true);
    hud.setTradeEnabled(true);
  }

  panel.x = (app.renderer.width - 560) / 2;
  panel.y = (app.renderer.height - 300) / 2;

  // בעת אישור/דחייה נחסום פעולות אחרות
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);

  app.stage.addChild(overlay);
}

/* ===============================================
   Shared UI helpers
   =============================================== */
function makeResourceButtons(keys, onPick, x, y) {
  const buttons = [];
  const gap = 6;
  let cx = x;
  keys.forEach(k => {
    const b = makeChip(k, () => onPick(k));
    b.container.x = cx; b.container.y = y; cx += b.container.width + gap;
    buttons.push(b.container);
  });
  return buttons;
}

function makeChip(label, onClick) {
  const container = new PIXI.Container();

  const g = new PIXI.Graphics();
  g.beginFill(0xffffff, 0.12); g.drawRoundedRect(0, 0, 88, 32, 10); g.endFill();
  g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.35 }); g.drawRoundedRect(0, 0, 88, 32, 10);
  container.addChild(g);

  const t = new PIXI.Text(label, { fontFamily: "Arial", fontSize: 14, fill: 0xffffff });
  t.x = 10; t.y = 8; container.addChild(t);

  container.eventMode = "static"; container.cursor = "pointer";
  container.on("pointertap", onClick);

  function setAlpha(a){ container.alpha = a; }
  return { container, setAlpha };
}

function makeMiniButton(label, onClick) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0x374151, 1); g.drawRoundedRect(0, 0, 32, 32, 8); g.endFill();
  g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.25 }); g.drawRoundedRect(0, 0, 32, 32, 8);
  c.addChild(g);

  const t = new PIXI.Text(label, { fontFamily: "Georgia, serif", fontSize: 18, fill: 0xffffff });
  t.x = 10; t.y = 1; // מעט גבוה כדי לא לעלות על הטקסט
  c.addChild(t);

  c.eventMode = "static"; c.cursor = "pointer";
  c.on("pointertap", onClick);
  return c;
}

function makeBigButton(label, onClick) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0x2563eb, 1); g.drawRoundedRect(0, 0, 140, 36, 8); g.endFill();
  g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.25 }); g.drawRoundedRect(0, 0, 140, 36, 8);
  c.addChild(g);

  const t = new PIXI.Text(label, { fontFamily: "Arial", fontSize: 14, fill: 0xffffff });
  t.x = 10; t.y = 8;
  c.addChild(t);

  c.eventMode = "static"; c.cursor = "pointer";
  c.on("pointertap", onClick);
  return c;
}

function makeSmallLink(label, onClick) {
  const c = new PIXI.Container();
  const t = new PIXI.Text(label, { fontFamily: "Arial", fontSize: 13, fill: 0xffffff });
  c.addChild(t);
  c.eventMode = "static"; c.cursor = "pointer";
  c.on("pointertap", onClick);
  return c;
}

/* ===============================================
   Logic helpers (bank ports + p2p)
   =============================================== */
function computeEffectiveRatesForCurrentPlayer(state, graph) {
  const me = state.players[state.currentPlayer - 1];
  const myVertices = new Set([...(me.settlements || []), ...(me.cities || [])]);
  const ports = state.ports || [];
  const defaultRates = { brick:4, wood:4, wheat:4, sheep:4, ore:4 };
  if (!graph || !graph.vertices || ports.length === 0 || myVertices.size === 0) return defaultRates;

  const portVertices = ports.map(p => {
    const vA = nearestVertexId(graph, p.edgePixels?.v1 || {x:0,y:0});
    const vB = nearestVertexId(graph, p.edgePixels?.v2 || {x:0,y:0});
    return new Set([vA, vB]);
  });

  let hasAnyPort = false;
  const hasResPort = { brick:false, wood:false, wheat:false, sheep:false, ore:false };

  ports.forEach((p, i) => {
    const verts = portVertices[i];
    for (const v of verts) {
      if (myVertices.has(v)) {
        if (p.type === "any") hasAnyPort = true;
        else if (hasResPort[p.type] !== undefined) hasResPort[p.type] = true;
        break;
      }
    }
  });

  const rates = { ...defaultRates };
  for (const k of Object.keys(rates)) {
    if (hasResPort[k]) rates[k] = 2;
    else if (hasAnyPort) rates[k] = 3;
  }
  return rates;
}

function nearestVertexId(graph, pt) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < graph.vertices.length; i++) {
    const v = graph.vertices[i];
    const dx = v.x - pt.x, dy = v.y - pt.y;
    const d = dx*dx + dy*dy;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function initZeroQtyMap() {
  const m = {}; RES_KEYS.forEach(k => (m[k] = 0)); return m;
}
function compactQty(m) {
  const out = {}; for (const k of RES_KEYS) if (m[k] > 0) out[k] = m[k]; return out;
}
function hasAtLeast(res, need) {
  for (const k in need) if ((res[k] || 0) < need[k]) return false;
  return true;
}
function addResources(res, add) {
  for (const k in add) res[k] = (res[k] || 0) + add[k];
}
function subResources(res, sub) {
  for (const k in sub) res[k] = (res[k] || 0) - sub[k];
}
function formatOfferSummary(offer, want) {
  const fmt = obj => Object.keys(obj).length ? Object.entries(obj).map(([k,v])=>`${v}×${k}`).join(", ") : "—";
  return `You give: ${fmt(offer)}\nYou get: ${fmt(want)}`;
}
function playerLabel(i, players) {
  const n = i + 1;
  const color = players?.[i]?.colorIdx ?? null;
  return color != null ? `P${n}` : `P${n}`;
}
function formatRates(r) {
  return `B:${r.brick} Wd:${r.wood} Wh:${r.wheat} Sh:${r.sheep} Or:${r.ore}`;
}
