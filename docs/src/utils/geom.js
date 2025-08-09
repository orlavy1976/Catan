// Pointy-top axial hex math + helpers
export function axialToPixel({ q, r }, size) {
  const x = size * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
  const y = size * (3/2 * r);
  return { x, y };
}

export function hexPolygonPoints(center, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30); // pointy-top
    pts.push(center.x + size * Math.cos(angle), center.y + size * Math.sin(angle));
  }
  return pts;
}

// Layout: classic 3-4-5-4-3 rings in axial coords, left-to-right per row
export function standardAxials() {
  const rows = [
    [0, -2], [1, -2], [2, -2],
    [-1, -1], [0, -1], [1, -1], [2, -1],
    [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
    [-2, 1], [-1, 1], [0, 1], [1, 1],
    [-2, 2], [-1, 2], [0, 2],
  ];
  return rows.map(([q, r]) => ({ q, r }));
}
