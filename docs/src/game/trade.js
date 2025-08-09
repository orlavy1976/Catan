import { RES_KEYS } from "../config/constants.js";

/**
 * מסחר עם הבנק — עכשיו עם תמיכה בנמלים:
 * אם יש לשחקן נמל ספציפי למשאב → 2:1
 * אחרת אם יש לו נמל כללי → 3:1
 * אחרת → 4:1
 *
 * דרישות:
 * - נכנסים לכאן רק ב-phase "play"
 * - מעדכן state + Resource Panel + הודעת HUD
 */
export function startBankTrade({ app, hud, state, resPanel, graph }) {
  const overlay = new PIXI.Container();
  overlay.zIndex = 10000;

  // מסך כהה מאחור
  const dim = new PIXI.Graphics();
  dim.beginFill(0x000000, 0.5);
  dim.drawRect(0, 0, app.renderer.width, app.renderer.height);
  dim.endFill();
  overlay.addChild(dim);

  // פאנל
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

  // סטטוס
  const status = new PIXI.Text("", { fontFamily: "Arial", fontSize: 16, fill: 0xffffaa });
  status.x = 20; status.y = 54;
  panel.addChild(status);

  // מצב בחירה
  let give = "brick";
  let get = "wheat";
  let mult = 1;

  // יחס אפקטיבי לכל משאב לפי נמל
  const rates = computeEffectiveRatesForCurrentPlayer(state, graph);

  function updateStatus() {
    const rate = rates[give] ?? 4;
    status.text = `Give ${rate*mult} × ${give}  →  Get ${mult} × ${get}   (rate ${rate}:1)`;
    hint.text = `Your port rates: ${formatRates(rates)}`;
  }

  // hint עם תקציר היחסים
  const hint = new PIXI.Text("", { fontFamily: "Arial", fontSize: 13, fill: 0xdddddd, wordWrap: true, wordWrapWidth: 520 });
  hint.x = 20; hint.y = 78;
  panel.addChild(hint);

  updateStatus();

  // שורת בחירה Give
  const giveLabel = new PIXI.Text("Give:", { fontFamily: "Arial", fontSize: 16, fill: 0xffffff });
  giveLabel.x = 20; giveLabel.y = 110; panel.addChild(giveLabel);

  const giveButtons = makeResourceButtons(RES_KEYS, (k) => { give = k; updateStatus(); }, 20, 134);
  giveButtons.forEach(b => panel.addChild(b));

  // שורת בחירה Get
  const getLabel = new PIXI.Text("Get:", { fontFamily: "Arial", fontSize: 16, fill: 0xffffff });
  getLabel.x = 20; getLabel.y = 192; panel.addChild(getLabel);

  const getButtons = makeResourceButtons(RES_KEYS, (k) => { get = k; updateStatus(); }, 20, 216);
  getButtons.forEach(b => panel.addChild(b));

  // בחירת כמות (מכפלת טרייד)
  const multLabel = new PIXI.Text("x", { fontFamily: "Arial", fontSize: 18, fill: 0xffffff });
  multLabel.x = 370; multLabel.y = 136; panel.addChild(multLabel);

  const multText = new PIXI.Text(`${mult}`, { fontFamily: "Georgia, serif", fontSize: 24, fill: 0xffffff });
  multText.x = 390; multText.y = 130; panel.addChild(multText);

  const plus = makeMiniButton("+", () => { mult++; updateStatus(); multText.text = `${mult}`; });
  plus.x = 430; plus.y = 56; panel.addChild(plus); // העלית למעלה לפי הבקשה הקודמת

  const minus = makeMiniButton("−", () => { mult = Math.max(1, mult-1); updateStatus(); multText.text = `${mult}`; });
  minus.x = 470; minus.y = 56; panel.addChild(minus);

  // כפתורי פעולה
  const confirm = makeBigButton("Confirm", () => {
    const me = state.players[state.currentPlayer - 1];
    const rate = rates[give] ?? 4;
    const need = rate * mult;
    if ((me.resources[give] || 0) < need) {
      showTemp(`Not enough ${give} (need ${need} for rate ${rate}:1).`);
      return;
    }
    me.resources[give] -= need;
    me.resources[get] = (me.resources[get] || 0) + mult;

    // עדכונים
    resPanel?.updateResources?.(state.players);
    hud.showResult(`Trade ${rate}:1 — -${need} ${give}  +${mult} ${get}`);

    close();
  });
  confirm.x = 320; confirm.y = 258; panel.addChild(confirm);

  const cancel = makeBigButton("Cancel", () => close());
  cancel.x = 200; cancel.y = 258; panel.addChild(cancel);

  function showTemp(t) {
    hud.showResult(t);
  }

  function close() {
    app.stage.removeChild(overlay);
    hud.setEndEnabled(true);
    hud.setBuildRoadEnabled(true);
    hud.setBuildSettlementEnabled(true);
    hud.setBuildCityEnabled(true);
    hud.setTradeEnabled(true);
  }

  // פריסה למסך
  panel.x = (app.renderer.width - 560) / 2;
  panel.y = (app.renderer.height - 300) / 2;

  // בעת פתיחה — לכבות כפתורים אחרים כדי למנוע מצבים ביניים
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);

  app.stage.addChild(overlay);
}

// ---------- Helpers ----------
function makeResourceButtons(keys, onPick, x, y) {
  const buttons = [];
  const gap = 6;
  let cx = x;
  keys.forEach(k => {
    const b = makeChip(k, () => onPick(k));
    b.x = cx; b.y = y; cx += b.width + gap;
    buttons.push(b);
  });
  return buttons;
}

function makeChip(label, onClick) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0xffffff, 0.12);
  g.drawRoundedRect(0, 0, 88, 32, 10);
  g.endFill();
  g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.35 });
  g.drawRoundedRect(0, 0, 88, 32, 10);
  c.addChild(g);

  const t = new PIXI.Text(label, { fontFamily: "Arial", fontSize: 14, fill: 0xffffff });
  t.x = 10; t.y = 8;
  c.addChild(t);

  c.eventMode = "static"; c.cursor = "pointer";
  c.on("pointertap", onClick);
  c.width = 88; c.height = 32;
  return c;
}

function makeMiniButton(label, onClick) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0x374151, 1);
  g.drawRoundedRect(0, 0, 32, 32, 8);
  g.endFill();
  g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.25 });
  g.drawRoundedRect(0, 0, 32, 32, 8);
  c.addChild(g);

  const t = new PIXI.Text(label, { fontFamily: "Georgia, serif", fontSize: 18, fill: 0xffffff });
  t.x = 10; t.y = 5;
  c.addChild(t);

  c.eventMode = "static"; c.cursor = "pointer";
  c.on("pointertap", onClick);
  return c;
}

function makeBigButton(label, onClick) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0x2563eb, 1);
  g.drawRoundedRect(0, 0, 110, 32, 8);
  g.endFill();
  g.lineStyle({ width: 1, color: 0xffffff, alpha: 0.25 });
  g.drawRoundedRect(0, 0, 110, 32, 8);
  c.addChild(g);

  const t = new PIXI.Text(label, { fontFamily: "Arial", fontSize: 14, fill: 0xffffff });
  t.x = 10; t.y = 8;
  c.addChild(t);

  c.eventMode = "static"; c.cursor = "pointer";
  c.on("pointertap", onClick);
  return c;
}

// --- Port logic ---

function computeEffectiveRatesForCurrentPlayer(state, graph) {
  const me = state.players[state.currentPlayer - 1];
  const myVertices = new Set([...(me.settlements || []), ...(me.cities || [])]);
  const ports = state.ports || [];

  // אם אין גרף/נמלים—כולם 4:1
  const defaultRates = { brick:4, wood:4, wheat:4, sheep:4, ore:4 };
  if (!graph || !graph.vertices || ports.length === 0 || myVertices.size === 0) return defaultRates;

  // מפה: portIndex -> שני מזהי-קודקוד בגרף הקרובים לקצוות הצלע
  const portVertices = ports.map(p => {
    const vA = nearestVertexId(graph, p.edgePixels.v1);
    const vB = nearestVertexId(graph, p.edgePixels.v2);
    return new Set([vA, vB]);
  });

  // האם יש לי חיבור לנמל כלשהו/ספציפי
  let hasAnyPort = false;
  const hasResPort = { brick:false, wood:false, wheat:false, sheep:false, ore:false };

  ports.forEach((p, i) => {
    const verts = portVertices[i];
    // אם יש לי ישוב/עיר על אחד מהקודקודים של הצלע — יש גישה לנמל
    for (const v of verts) {
      if (myVertices.has(v)) {
        if (p.type === "any") hasAnyPort = true;
        else if (hasResPort[p.type] !== undefined) hasResPort[p.type] = true;
        break;
      }
    }
  });

  // בונים יחסים אפקטיביים
  const rates = { ...defaultRates };
  for (const k of Object.keys(rates)) {
    if (hasResPort[k]) rates[k] = 2;
    else if (hasAnyPort) rates[k] = 3;
  }
  return rates;
}

function nearestVertexId(graph, pt) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < graph.vertices.length; i++) {
    const v = graph.vertices[i];
    const dx = v.x - pt.x, dy = v.y - pt.y;
    const d = dx*dx + dy*dy;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function formatRates(rates) {
  return `B:${rates.brick} Wd:${rates.wood} Wh:${rates.wheat} Sh:${rates.sheep} Or:${rates.ore}`;
}
