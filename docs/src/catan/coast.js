import { axialToPixel, hexPolygonPoints } from "../utils/geom.js";

// היסטי שכנים באקסיאלי (pointy-top) — רק כוקטורי שכנות, בלי מיפוי ל-side
const DIRS = [
  { q: +1, r: 0 },   // E
  { q: +1, r: -1 },  // NE
  { q: 0,  r: -1 },  // NW
  { q: -1, r: 0 },   // W
  { q: -1, r: +1 },  // SW
  { q: 0,  r: +1 },  // SE
];

/**
 * מחשב את צלעות החוף המדויקות.
 * לא נשען על "side→dir" ידני; ממפה שכנים לזווית → side הקרוב (0..5).
 */
export function computeCoastEdges(axials, size) {
  const set = new Set(axials.map(a => key(a)));
  const boardCenter = avg(axials.map(a => axialToPixel(a, size)));
  const edges = [];

  for (const a of axials) {
    const centerPx = axialToPixel(a, size);
    const verts = vertsOfHex(centerPx, size); // 6 נקודות של ההקס (CCW, מתחיל ב־-30°)
    const hasNeighbor = [false, false, false, false, false, false];

    // סמן עבור איזה side יש שכן בפועל (ע״י זווית → side)
    for (const d of DIRS) {
      const nb = { q: a.q + d.q, r: a.r + d.r };
      if (!set.has(key(nb))) continue;
      const nbPx = axialToPixel(nb, size);
      const ang = Math.atan2(nbPx.y - centerPx.y, nbPx.x - centerPx.x);
      const side = angleToSide(ang);
      hasNeighbor[side] = true;
    }

    // כל side שאין לו שכן ⇒ צלע חוף
    for (let side = 0; side < 6; side++) {
      if (hasNeighbor[side]) continue;

      const i1 = side, i2 = (side + 1) % 6;
      const v1 = verts[i1];
      const v2 = verts[i2];
      const mid = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };

      // נורמל החוצה (מרכז ההקס → מרכז הצלע)
      const nx0 = mid.x - centerPx.x;
      const ny0 = mid.y - centerPx.y;
      const nl = Math.hypot(nx0, ny0) || 1;
      const normal = { x: nx0 / nl, y: ny0 / nl };

      // זווית סביב מרכז כל הלוח (למיון היקפי)
      const angBoard = Math.atan2(mid.y - boardCenter.y, mid.x - boardCenter.x);

      edges.push({ a, side, v1, v2, mid, normal, angle: angBoard });
    }
  }

  // ממיינים סביב ההיקף וממספרים אינדקסים
  edges.sort((e1, e2) => e1.angle - e2.angle);
  edges.forEach((e, i) => (e.index = i));

  return { edges, boardCenter };
}

function key(a){ return `${a.q},${a.r}`; }

function vertsOfHex(centerPx, size) {
  const pts = hexPolygonPoints(centerPx, size);
  const out = [];
  for (let i = 0; i < 6; i++) out.push({ x: pts[2*i], y: pts[2*i+1] });
  return out;
}

function avg(points){
  const s = points.reduce((acc,p)=>({x:acc.x+p.x,y:acc.y+p.y}),{x:0,y:0});
  return { x: s.x/points.length, y: s.y/points.length };
}

/** ממיר זווית (רדיאנים) ל־side 0..5, כשה־side 0 פונה למזרח (0°), CCW כל 60° */
function angleToSide(rad) {
  let deg = rad * 180 / Math.PI;
  if (deg < 0) deg += 360;
  // עיגול ל־60° הקרוב והמרה ל־0..5
  return Math.round(deg / 60) % 6;
}

/** דיבאגר — אינדקסי צלעות חוף (מצויר בתוך boardC) */
export function drawCoastDebug(boardC, coast, color = 0xffffff, inset = 24) {
  boardC.sortableChildren = true;

  const layer = new PIXI.Container();
  layer.zIndex = 100000;
  boardC.addChild(layer);

  const lines = new PIXI.Graphics();
  lines.lineStyle(2, color, 0.6);

  coast.edges.forEach(e => {
    lines.moveTo(e.v1.x, e.v1.y);
    lines.lineTo(e.v2.x, e.v2.y);

    const lx = e.mid.x - e.normal.x * inset;
    const ly = e.mid.y - e.normal.y * inset;

    const bubble = new PIXI.Graphics();
    bubble.beginFill(0xffffff, 0.95);
    bubble.lineStyle(1, 0x000000, 0.6);
    bubble.drawCircle(0, 0, 9);
    bubble.endFill();
    bubble.x = lx; bubble.y = ly;

    const t = new PIXI.Text(`${e.index}`, { fontFamily: "Arial", fontSize: 12, fill: 0x000000 });
    t.anchor.set(0.5);
    t.x = lx; t.y = ly;

    layer.addChild(bubble);
    layer.addChild(t);
  });

  layer.addChild(lines);
  return layer;
}

/** (אופציונלי) דיבאגר שמראה לכל הקס את ה-sides 0..5 על ההקס עצמו */
export function drawSidesPerHexDebug(boardC, axials, size, color = 0xff00ff) {
  const layer = new PIXI.Container();
  layer.zIndex = 100050;
  boardC.addChild(layer);

  axials.forEach(a => {
    const c = axialToPixel(a, size);
    for (let side = 0; side < 6; side++) {
      const ang = (side * Math.PI / 3); // 0,60,120...
      const mx = c.x + Math.cos(ang) * size * 0.8;
      const my = c.y + Math.sin(ang) * size * 0.8;

      const g = new PIXI.Graphics();
      g.beginFill(0xffffff, 0.9).lineStyle(1, color, 0.7).drawCircle(0, 0, 8).endFill();
      g.x = mx; g.y = my;

      const t = new PIXI.Text(String(side), { fontFamily: "Arial", fontSize: 10, fill: 0x000000 });
      t.anchor.set(0.5);
      g.addChild(t);

      layer.addChild(g);
    }
  });

  return layer;
}
