/** Rounded collision bounds follow both the ball's squash and the circular pickup. */
export function ballTouchesCircle(
  ballX: number, ballY: number, radiusX: number, radiusY: number,
  circleX: number, circleY: number, radius: number,
) {
  const dx = (ballX - circleX) / (radiusX + radius);
  const dy = (ballY - circleY) / (radiusY + radius);
  return dx * dx + dy * dy <= 1;
}

export function nextSpikeSpeed(previous: number, random = Math.random()) {
  const sampled = 80 + random * 260;
  return Math.abs(sampled - previous) >= 100 ? sampled : previous < 210 ? previous + 110 : previous - 110;
}

export function spikeLimit(score: number) {
  return score < 3 ? 0 : 1 + Math.floor((score - 3) / 4);
}

/** Layout coordinates ignore reveal/hover transforms, unlike bounding rectangles. */
export function layoutBottomWithin(element: HTMLElement, ancestor: HTMLElement) {
  let bottom = element.offsetHeight;
  for (let node: HTMLElement | null = element; node && node !== ancestor; node = node.offsetParent as HTMLElement | null) {
    bottom += node.offsetTop;
  }
  return bottom;
}

/** Test the actual triangle against the ball's current ellipse. */
export function ballTouchesSpike(
  ballX: number, ballY: number, radiusX: number, radiusY: number,
  spikeX: number, width: number, height: number,
) {
  const vertices = [
    [(spikeX - width / 2 - ballX) / radiusX, -ballY / radiusY],
    [(spikeX - ballX) / radiusX, (height - ballY) / radiusY],
    [(spikeX + width / 2 - ballX) / radiusX, -ballY / radiusY],
  ];
  const sides = vertices.map(([ax, ay], i) => {
    const [bx, by] = vertices[(i + 1) % 3];
    return ax * by - ay * bx;
  });
  if (sides.every(value => value >= 0) || sides.every(value => value <= 0)) return true;

  return vertices.some(([ax, ay], i) => {
    const [bx, by] = vertices[(i + 1) % 3];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy)));
    return (ax + t * dx) ** 2 + (ay + t * dy) ** 2 <= 1;
  });
}
