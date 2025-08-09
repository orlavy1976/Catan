import { axialToPixel, hexPolygonPoints } from "../utils/geom.js";

// מצמידים לקואורדינטות משותפות עם סף עיגול קטן
const snap = (n) => Math.round(n * 100) / 100; // דיוק שתי ספרות אחרי הנקודה
const keyOf = (x, y) => `${snap(x)}|${snap(y)}`;

export function buildGraph(axials, size) {
  const vMap = new Map();        // key -> vertexId
  const vertices = [];           // { id, x, y, tiles:Set(tileIdx) }
  const edges = [];              // { id, a, b, tiles:Set(tileIdx) }
  const edgeMap = new Map();     // "min-max" -> edgeId

  axials.forEach((ax, tileIdx) => {
    const center = axialToPixel(ax, size);
    const pts = hexPolygonPoints(center, size); // [x0,y0,x1,y1,...,x5,y5]

    // הפוך לוקטור של 6 קודקודים מסודרים
    const verts = [];
    for (let i = 0; i < 6; i++) {
      const x = pts[i * 2];
      const y = pts[i * 2 + 1];
      const k = keyOf(x, y);
      let id = vMap.get(k);
      if (id == null) {
        id = vertices.length;
        vMap.set(k, id);
        vertices.push({ id, x: snap(x), y: snap(y), tiles: new Set([tileIdx]) });
      } else {
        vertices[id].tiles.add(tileIdx);
      }
      verts.push(id);
    }

    // הוסף 6 קצוות מסביב למשושה (a->b, ב־modulo)
    for (let i = 0; i < 6; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % 6];
      const min = Math.min(a, b), max = Math.max(a, b);
      const ek = `${min}-${max}`;
      let eid = edgeMap.get(ek);
      if (eid == null) {
        eid = edges.length;
        edgeMap.set(ek, eid);
        edges.push({ id: eid, a: min, b: max, tiles: new Set([tileIdx]) });
      } else {
        edges[eid].tiles.add(tileIdx);
      }
    }
  });

  // שכנות צמתים לקצוות
  const vAdjEdges = Array.from({ length: vertices.length }, () => []);
  edges.forEach(e => {
    vAdjEdges[e.a].push(e.id);
    vAdjEdges[e.b].push(e.id);
  });

  // שכנות צמתים-צמתים (דרך קצה משותף)
  const vAdjVertices = Array.from({ length: vertices.length }, () => new Set());
  edges.forEach(e => {
    vAdjVertices[e.a].add(e.b);
    vAdjVertices[e.b].add(e.a);
  });

  return { vertices, edges, vAdjEdges, vAdjVertices };
}
