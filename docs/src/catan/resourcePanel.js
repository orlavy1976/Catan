// פאנל משאבים אנכי לשמאל המסך: לכל שחקן שורה עם צבע, מזהה, וספירת משאבים.
const RES_ORDER = ["brick","wood","wheat","sheep","ore"];
const RES_LABELS = {
  brick: "Brick",
  wood:  "Wood",
  wheat: "Wheat",
  sheep: "Sheep",
  ore:   "Ore",
};
const RES_COLORS = {
  brick: 0xb24d3d,
  wood:  0x2a6e3a,
  wheat: 0xd9bb49,
  sheep: 0x7dbf6a,
  ore:   0x6c707d,
};

export function createResourcePanel(app, state) {
  const panel = new PIXI.Container();
  panel.zIndex = 900; // מתחת ל-HUD העליון (שהוא 1000)
  app.stage.addChild(panel);
  app.stage.sortableChildren = true;

  // רקע פאנל
  const bg = new PIXI.Graphics();
  panel.addChild(bg);

  // כותרת
  const title = new PIXI.Text("Players", {
    fontFamily: "Georgia, serif",
    fontSize: 18,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 3,
  });
  panel.addChild(title);

  // שורות שחקנים
  const rows = []; // { root, badge, nameText, res:{key:Text}, highlight:Graphics }

  function makeResCell(kind) {
    const c = new PIXI.Container();

    // אייקון צבעוני קטן
    const icon = new PIXI.Graphics();
    icon.beginFill(RES_COLORS[kind], 0.95);
    icon.drawRoundedRect(0, 0, 22, 18, 4);
    icon.endFill();
    icon.lineStyle({ width: 1, color: 0x000000, alpha: 0.25 });
    icon.drawRoundedRect(0, 0, 22, 18, 4);
    c.addChild(icon);

    // אות ראשונה
    const letter = new PIXI.Text(RES_LABELS[kind][0], {
      fontFamily: "Georgia, serif",
      fontSize: 12,
      fill: 0x101010,
      stroke: 0xffffff,
      strokeThickness: 2,
    });
    letter.anchor.set(0.5, 0.5);
    letter.x = 11; letter.y = 9;
    c.addChild(letter);

    // מונה
    const count = new PIXI.Text("0", {
      fontFamily: "Georgia, serif",
      fontSize: 14,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 3,
    });
    count.x = 26; count.y = 0;
    c.addChild(count);

    return { container: c, countText: count };
  }

  function buildRows() {
    // נקה קיים
    rows.forEach(r => panel.removeChild(r.root));
    rows.length = 0;

    const rowGap = 56;
    state.players.forEach((p, idx) => {
      const root = new PIXI.Container();

      // רקע/היילייט לשורה
      const highlight = new PIXI.Graphics();
      highlight.beginFill(0xffffff, 0.08);
      highlight.drawRoundedRect(0, 0, 240, 44, 10);
      highlight.endFill();
      highlight.alpha = 0; // כבוי כברירת מחדל
      root.addChild(highlight);

      // באדג' צבע שחקן
      const badge = new PIXI.Graphics();
      badge.beginFill(playerColor(p), 1);
      badge.drawCircle(0, 0, 10);
      badge.endFill();
      badge.x = 16; badge.y = 22;
      root.addChild(badge);

      // שם/מזהה
      const nameText = new PIXI.Text(`P${p.id}`, {
        fontFamily: "Georgia, serif",
        fontSize: 16,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 3,
      });
      nameText.x = 30; nameText.y = 12;
      root.addChild(nameText);

      // תאי משאב
      const resTexts = {};
      let x = 70;
      RES_ORDER.forEach(k => {
        const cell = makeResCell(k);
        cell.container.x = x; cell.container.y = 13;
        root.addChild(cell.container);
        resTexts[k] = cell.countText;
        x += 52;
      });

      root.y = 40 + idx * rowGap;
      panel.addChild(root);

      rows.push({ root, badge, nameText, res: resTexts, highlight });
    });
  }

  function layout() {
    const pad = 16;
    // רקע
    const width = 260;
    const height = Math.max(40 + state.players.length * 56, 120);

    bg.clear();
    bg.beginFill(0x000000, 0.18);
    bg.drawRoundedRect(0, 0, width, height, 16);
    bg.endFill();
    bg.lineStyle({ width: 1, color: 0xffffff, alpha: 0.12 });
    bg.drawRoundedRect(0, 0, width, height, 16);

    title.x = 12; title.y = 8;

    // מיקום כל הפאנל במסך
    panel.x = pad;
    panel.y = 88; // מתחת לבאנר העליון
  }

  function updateResources(players) {
    players.forEach((p, idx) => {
      const row = rows[idx];
      if (!row) return;
      const r = p.resources;
      RES_ORDER.forEach(k => {
        row.res[k].text = String(r[k] ?? 0);
      });
    });
  }

  function setCurrent(playerIndexZeroBased) {
    rows.forEach((r, i) => {
      r.highlight.alpha = (i === playerIndexZeroBased) ? 0.25 : 0;
    });
  }

  function playerColor(p) {
    // משתמשים בצבע שכבר שמור ב-state (colorIdx) אם קיים
    const COLORS = [0xd32f2f, 0x1976d2, 0xffa000, 0x388e3c];
    return COLORS[p.colorIdx ?? 0] ?? 0xaaaaaa;
  }

  // בנייה ראשונית
  buildRows();
  layout();
  window.addEventListener("resize", layout);

  // התחלה: עדכון 0 והדגשה
  updateResources(state.players);
  setCurrent((state.currentPlayer ?? 1) - 1);

  return { container: panel, updateResources, setCurrent };
}
