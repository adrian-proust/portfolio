/** Swept hit detection prevents a fast projectile skipping over a target. */
export function segmentHitsCircle(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, radius: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / lengthSquared)) : 0;
  return (ax + t * dx - cx) ** 2 + (ay + t * dy - cy) ** 2 <= radius * radius;
}
export function targetDifficulty(score: number) {
  return {
    radius: Math.max(8, 106.875 * 0.9 ** (score < 5 ? 0 : 1 + Math.floor((score - 5) / 2))),
    speed: score < 4 ? 0 : 26 + Math.floor((score - 4) / 2) * 6,
  };
}
export function projectileSettings(giant: boolean, fast: boolean) {
  return { radius: giant ? 36 : 12, speedMultiplier: fast ? 1.5 : 1, handleScale: giant ? 2.2 : 1 };
}
export function projectileStretch(fast: boolean, moving: boolean, reducedMotion: boolean) {
  return fast && moving && !reducedMotion ? { x: 1.4, y: .72 } : { x: 1, y: 1 };
}

export function stretchedProjectileHit(ax: number, ay: number, bx: number, by: number, targetX: number, radius: number, projectileRadius: number, angle: number, stretch: { x: number; y: number }) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const rx = radius + projectileRadius * stretch.x, ry = radius + projectileRadius * stretch.y;
  const transform = (x: number, y: number) => [((x - targetX) * cos + y * sin) / rx, (-(x - targetX) * sin + y * cos) / ry];
  const a = transform(ax, ay), b = transform(bx, by);
  return segmentHitsCircle(a[0], a[1], b[0], b[1], 0, 0, 1);
}
