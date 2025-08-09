import { axialToPixel } from "../utils/geom.js";

// שכנים באינדקסי קודקודים של משושה נקודתי-קודקוד (pointy-top)
const HEX_VERTS = [
  [-30, -52], [30, -52], [60, 0], [30, 52], [-30, 52], [-60, 0]
];

export function buildGraph(axials, size) {
  // מפות עזר
  const vMap = new Map();   // key "x|y" (עיגול לרשת גסה) -> vertexId
  const vertices = [];      // {id, x,y, tiles:Set(tileIdx)}
  const edges = [];         // {id, a,b, tiles:Set(tileIdx)}
  const edgeMap = new Map();// key "minV-maxV" -> edgeId

  const quant = (n) => Math.round(n); // כימות מספיק טוב לשמירה על ייחודיות

  // צור צמתים וקצוות מכל משושה
  axials.forEach((ax, tileIdx) => {
    const c = axialToPixel(ax, size);
    // קודקודים משוערים סביב המרכז
    const verts = HEX_VERTS.map(([dx, dy]) => ({ x: c.x + (dx*size/60), y: c.y + (dy*size/60) }));

    // הוסף צמתים למפה מאוחדת
    const vIds = verts.map(v => {
      const k = `${quant(v.x)}|${quant(v.y)}`;
      let id = vMap.get(k);
      if (id == null) {
        id = vertices.length;
        vMap.set(k, id);
        vertices.push({ id, x: v.x, y: v.y, tiles: new Set([tileIdx]) });
      } else {
        vertices[id].tiles.add(tileIdx);
      }
      return id;
    });

    // הוסף קצוות (6 מסביב)
    for (let i = 0; i < 6; i++) {
      const a = vIds[i];
      const b = vIds[(i+1)%6];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      let eid = edgeMap.get(key);
      if (eid == null) {
        eid = edges.length;
        edgeMap.set(key, eid);
        edges.push({ id: eid, a: Math.min(a,b), b: Math.max(a,b), tiles: new Set([tileIdx]) });
      } else {
        edges[eid].tiles.add(tileIdx);
      }
    }
  });

  // שכנות צמתים לקצוות
  const vAdjEdges = Array.from({length: vertices.length}, () => []);
  edges.forEach(e => {
    vAdjEdges[e.a].push(e.id);
    vAdjEdges[e.b].push(e.id);
  });

  // שכנות צמתים-צמתים (דרך קצה משותף)
  const vAdjVertices = Array.from({length: vertices.length}, () => new Set());
  edges.forEach(e => {
    vAdjVertices[e.a].add(e.b);
    vAdjVertices[e.b].add(e.a);
  });

  return {
    vertices, edges, vAdjEdges, vAdjVertices
  };
}
