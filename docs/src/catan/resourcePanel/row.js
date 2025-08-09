import { makeResIcon } from "./icon.js";

const RES_ORDER = ["brick","wood","wheat","sheep","ore"];
const PLAYER_COLORS = [0xd32f2f, 0x1976d2, 0xffa000, 0x388e3c];

export function makePlayerRow(player) {
  const container = new PIXI.Container();

  // רקע/היילייט לשורה
  const highlight = new PIXI.Graphics();
  highlight.beginFill(0xffffff, 0.08);
  highlight.drawRoundedRect(0, 0, 240, 44, 10);
  highlight.endFill();
  highlight.alpha = 0;
  container.addChild(highlight);

  // באדג' צבע
  const badge = new PIXI.Graphics();
  badge.beginFill(PLAYER_COLORS[player.colorIdx ?? 0], 1);
  badge.drawCircle(0, 0, 10);
  badge.endFill();
  badge.x = 16; badge.y = 22;
  container.addChild(badge);

  // שם/מזהה
  const nameText = new PIXI.Text(`P${player.id}`, {
    fontFamily: "Georgia, serif",
    fontSize: 16,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 3,
  });
  nameText.x = 30; nameText.y = 12;
  container.addChild(nameText);

  // תאי משאב
  const counters = {}; // kind -> setCount
  let x = 70;
  RES_ORDER.forEach(k => {
    const cell = makeResIcon(k);
    cell.container.x = x; cell.container.y = 13;
    container.addChild(cell.container);
    counters[k] = cell.setCount;
    x += 52;
  });

  function setResource(kind, count) {
    counters[kind]?.(count);
  }
  function setActive(active) {
    highlight.alpha = active ? 0.25 : 0;
  }

  return { container, setResource, setActive };
}
