/** Circle/ellipse against an axis-aligned square, including corner contacts. */
export function ballTouchesSquare(
  ballX: number, ballY: number, radiusX: number, radiusY: number,
  squareX: number, squareY: number, size: number,
) {
  const dx = Math.max(Math.abs(ballX - squareX) - size / 2, 0) / radiusX;
  const dy = Math.max(Math.abs(ballY - squareY) - size / 2, 0) / radiusY;
  return dx * dx + dy * dy <= 1;
}
