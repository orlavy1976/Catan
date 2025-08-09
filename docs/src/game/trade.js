import { RES_KEYS } from "../config/constants.js";

/**
 * מסחר עם הבנק 4:1.
 * UI מינימלי: בחירת משאב שנותנים, בחירת משאב שמקבלים, וכמות (במכפלות של 1 -> 4:1).
 * דרישות:
 * - חייבים לגלגל קודם (נכנסים לכאן רק ב-play).
 * - בודק שיש מספיק משאבים.
 * - מעדכן state + Resource Panel + הודעת HUD.
 */
export function startBankTrade({ app, hud, state, resPanel }) {
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
  bg.drawRoundedRect(0, 0, 520, 260, 16);
  bg.endFill();
  bg.lineStyle({ width: 2, color: 0xffffff, alpha: 0.2 });
  bg.drawRoundedRect(0, 0, 520, 260, 16);
  panel.addChild(bg);

  const title = new PIXI.Text("Bank Trade (4:1)", { fontFamily: "Georgia, serif", fontSize: 22, fill: 0xffffff });
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

  function updateStatus() {
    status.text = `Give ${4*mult} × ${give}  →  Get ${mult} × ${get}`;
  }
  updateStatus();

  // שורת בחירה Give
  const giveLabel = new PIXI.Text("Give:", { fontFamily: "Arial", fontSize: 16, fill: 0xffffff });
  giveLabel.x = 20; giveLabel.y = 88; panel.addChild(giveLabel);

  const giveButtons = makeResourceButtons(RES_KEYS, (k) => { give = k; updateStatus(); }, 20, 112);
  giveButtons.forEach(b => panel.addChild(b));

  // שורת בחירה Get
  const getLabel = new PIXI.Text("Get:", { fontFamily: "Arial", fontSize: 16, fill: 0xffffff });
  getLabel.x = 20; getLabel.y = 160; panel.addChild(getLabel);

  const getButtons = makeResourceButtons(RES_KEYS, (k) => { get = k; updateStatus(); }, 20, 184);
  getButtons.forEach(b => panel.addChild(b));

  // בחירת כמות (מכפלת טרייד)
  const multLabel = new PIXI.Text("x", { fontFamily: "Arial", fontSize: 18, fill: 0xffffff });
  multLabel.x = 360; multLabel.y = 110; panel.addChild(multLabel);

  const multText = new PIXI.Text(`${mult}`, { fontFamily: "Georgia, serif", fontSize: 24, fill: 0xffffff });
  multText.x = 380; multText.y = 104; panel.addChild(multText);

  const plus = makeMiniButton("+", () => { mult++; updateStatus(); multText.text = `${mult}`; });
  plus.x = 420; plus.y = 30; panel.addChild(plus);

  const minus = makeMiniButton("−", () => { mult = Math.max(1, mult-1); updateStatus(); multText.text = `${mult}`; });
  minus.x = 460; minus.y = 30; panel.addChild(minus);

  // כפתורי פעולה
  const confirm = makeBigButton("Confirm", () => {
    const me = state.players[state.currentPlayer - 1];
    const need = 4 * mult;
    if ((me.resources[give] || 0) < need) {
      showTemp("Not enough resources for this trade.");
      return;
    }
    me.resources[give] -= need;
    me.resources[get] = (me.resources[get] || 0) + mult;

    // עדכונים
    resPanel?.updateResources?.(state.players);
    hud.showResult(`Bank trade: -${need} ${give}  +${mult} ${get}`);

    close();
  });
  confirm.x = 300; confirm.y = 214; panel.addChild(confirm);

  const cancel = makeBigButton("Cancel", () => close());
  cancel.x = 180; cancel.y = 214; panel.addChild(cancel);

  function showTemp(t) {
    hud.showResult(t);
  }

  function close() {
    app.stage.removeChild(overlay);
    // החזרת כפתורים (ה־Trade נשאר דולק, כקודם)
    hud.setEndEnabled(true);
    hud.setBuildRoadEnabled(true);
    hud.setBuildSettlementEnabled(true);
    hud.setBuildCityEnabled(true);
    hud.setTradeEnabled(true);
  }

  // פריסה למסך
  panel.x = (app.renderer.width - 520) / 2;
  panel.y = (app.renderer.height - 260) / 2;

  // בעת פתיחה — לכבות כפתורים אחרים כדי למנוע מצבים ביניים
  hud.setEndEnabled(false);
  hud.setBuildRoadEnabled(false);
  hud.setBuildSettlementEnabled(false);
  hud.setBuildCityEnabled(false);
  hud.setTradeEnabled(false);

  app.stage.addChild(overlay);
}

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
