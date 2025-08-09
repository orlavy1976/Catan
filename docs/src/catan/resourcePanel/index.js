import { makePlayerRow } from "./row.js";

const RES_ORDER = ["brick","wood","wheat","sheep","ore"];

export function createResourcePanel(app, state) {
  const panel = new PIXI.Container();
  panel.zIndex = 900;
  app.stage.addChild(panel);
  app.stage.sortableChildren = true;

  // רקע
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
  const rows = []; // { container, setResource(kind,count), setActive(isActive) }

  function buildRows() {
    // נקה קיים
    rows.forEach(r => panel.removeChild(r.container));
    rows.length = 0;

    const rowGap = 56;
    state.players.forEach((p, idx) => {
      const row = makePlayerRow(p);
      row.container.y = 40 + idx * rowGap;
      panel.addChild(row.container);
      rows.push(row);
    });
  }

  function layout() {
    const width = 260;
    const height = Math.max(40 + state.players.length * 56, 120);
    bg.clear();
    bg.beginFill(0x000000, 0.18);
    bg.drawRoundedRect(0, 0, width, height, 16);
    bg.endFill();
    bg.lineStyle({ width: 1, color: 0xffffff, alpha: 0.12 });
    bg.drawRoundedRect(0, 0, width, height, 16);

    title.x = 12; title.y = 8;

    const pad = 16;
    panel.x = pad;
    panel.y = 88; // מתחת לבאנר העליון
  }

  function updateResources(players) {
    players.forEach((p, idx) => {
      const row = rows[idx];
      if (!row) return;
      RES_ORDER.forEach(k => row.setResource(k, p.resources?.[k] ?? 0));
    });
  }

  function setCurrent(playerIndexZeroBased) {
    rows.forEach((r, i) => r.setActive(i === playerIndexZeroBased));
  }

  // בנייה ראשונית
  buildRows();
  layout();
  window.addEventListener("resize", layout);

  // init
  updateResources(state.players);
  setCurrent((state.currentPlayer ?? 1) - 1);

  return { container: panel, updateResources, setCurrent };
}
