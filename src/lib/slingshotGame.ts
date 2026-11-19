/** Swept hit detection prevents a fast projectile skipping over a target. */
export function segmentHitsCircle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, radius: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / lengthSquared)) : 0;
  return (ax + t * dx - cx) ** 2 + (ay + t * dy - cy) ** 2 <= radius * radius;
}
