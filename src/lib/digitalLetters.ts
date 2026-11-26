export type Point = { x: number; y: number };

// Bevelled eight-unit bars use the same proportions as the score display.
const bar = (ax: number, ay: number, bx: number, by: number) => {
  const length = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / length, uy = (by - ay) / length;
  return [[0, 0], [4, -4], [length - 4, -4], [length, 0], [length - 4, 4], [4, 4]]
    .map(([along, across]) => `${ax + ux * along - uy * across},${ay + uy * along + ux * across}`).join(' ');
};

// Diagonals have four corners and parallel horizontal ends, without bevels.
const diagonal = (ax: number, ay: number, bx: number, by: number, outer: 'start' | 'end') => {
  // Retract the outer end along its axis to clear the neighbouring upright.
  // Keeping the same axis and horizontal cuts preserves the parallelogram.
  const length = Math.hypot(bx - ax, by - ay);
  const dx = (bx - ax) / length * 5, dy = (by - ay) / length * 5;
  if (outer === 'start') { ax += dx; ay += dy; }
  else { bx -= dx; by -= dy; }
  return `${ax - 2},${ay} ${ax + 2},${ay} ${bx + 2},${by} ${bx - 2},${by}`;
};

export const letterBars: Record<string, string> = {
  a: bar(4, 10, 38, 10),
  b: bar(38, 12, 38, 37), c: bar(38, 39, 38, 64),
  d: bar(4, 66, 38, 66),
  e: bar(4, 39, 4, 64), f: bar(4, 12, 4, 37),
  g1: bar(4, 38, 20, 38), g2: bar(22, 38, 38, 38),
  h: diagonal(9, 16, 18, 33, 'start'), i: diagonal(33, 16, 24, 33, 'start'),
  j: diagonal(18, 43, 9, 60, 'end'), k: diagonal(24, 43, 33, 60, 'end'),
  l: bar(21, 16, 21, 37), m: bar(21, 39, 21, 60),
};
export const digitalLetters: Record<string, string[]> = {
  F: ['a', 'f', 'g1', 'g2', 'e'],
  U: ['f', 'e', 'd', 'c', 'b'],
  N: ['f', 'e', 'h', 'k', 'b', 'c'],
  A: ['a', 'b', 'c', 'e', 'f', 'g1', 'g2'],
  R: ['a', 'b', 'g1', 'g2', 'f', 'e', 'k'],
  T: ['a', 'l', 'm'],
};

/** Circle/convex polygon contact, including bevels and balls starting inside a bar. */
export function segmentContact(x: number, y: number, radius: number, vertices: Point[]) {
  let closestX = 0, closestY = 0, distanceSquared = Infinity;
  const sides: number[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    sides.push(dx * (y - a.y) - dy * (x - a.x));
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)));
    const px = a.x + t * dx, py = a.y + t * dy;
    const d = (x - px) ** 2 + (y - py) ** 2;
    if (d < distanceSquared) { distanceSquared = d; closestX = px; closestY = py; }
  }
  const inside = sides.every(s => s >= 0) || sides.every(s => s <= 0);
  if (!inside && distanceSquared >= radius * radius) return null;
  const distance = Math.sqrt(distanceSquared);
  const sign = inside ? -1 : 1;
  return { nx: distance > 0.0001 ? sign * (x - closestX) / distance : 1,
    ny: distance > 0.0001 ? sign * (y - closestY) / distance : 0,
    depth: inside ? radius + distance : radius - distance };
}
