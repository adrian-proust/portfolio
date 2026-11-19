import { useEffect, useRef, type ReactNode } from 'react';
import { segmentHitsCircle } from '../lib/slingshotGame';
import './SelectedWorkPlayground.css';

const BALL_RADIUS = 12;
const TARGET_RADIUS = 19;

export default function SelectedWorkPlayground({ children, enabled, onHit }: {
  children: ReactNode; enabled: boolean; onHit: () => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<SVGSVGElement>(null);
  const ropesRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const ball = ballRef.current;
    const target = targetRef.current;
    const ropes = ropesRef.current;
    const content = area?.querySelector<HTMLElement>('.projects__playground');
    if (!enabled || !area || !ball || !target || !ropes || !content) return;
    let width = 0, height = 0, anchorX = 0, anchorY = 0;
    let x = 0, y = 0, targetX = 0, targetY = 0;
    let vx = 0, vy = 0, frame = 0, lastTime = 0;
    let pointer: number | null = null;
    let flying = false;
    const lines = Array.from(ropes.querySelectorAll('line'));
    const paint = () => {
      ball.style.transform = `translate3d(${x - BALL_RADIUS}px, ${y - BALL_RADIUS}px, 0)`;
      target.style.transform = `translate3d(${targetX - TARGET_RADIUS}px, ${targetY - TARGET_RADIUS}px, 0)`;
      ball.dataset.state = flying ? 'flying' : pointer === null ? 'ready' : 'dragging';
      lines.forEach((line, i) => {
        line.setAttribute('x1', String(anchorX + 14));
        line.setAttribute('y1', String(anchorY + (i ? 25 : -25)));
        line.setAttribute('x2', String(flying ? anchorX : x));
        line.setAttribute('y2', String(flying ? anchorY : y));
      });
    };
    const placeTarget = (first = false) => {
      const range = Math.min(240, height * 0.24);
      const previous = targetY;
      targetY = first ? anchorY : Math.max(TARGET_RADIUS, Math.min(height - TARGET_RADIUS, anchorY + (Math.random() * 2 - 1) * range));
      if (!first && Math.abs(targetY - previous) < 65) {
        targetY = Math.max(TARGET_RADIUS, Math.min(height - TARGET_RADIUS, previous <= anchorY ? anchorY + range * 0.8 : anchorY - range * 0.8));
      }
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      flying = false;
      if (pointer !== null && ball.hasPointerCapture(pointer)) ball.releasePointerCapture(pointer);
      pointer = null;
      x = anchorX;
      y = anchorY;
      paint();
    };
    const tick = (now: number) => {
      frame = 0;
      if (!flying) return;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.032) : 1 / 60;
      lastTime = now;
      const nextX = x + vx * dt;
      const nextY = y + vy * dt;
      if (segmentHitsCircle(x, y, nextX, nextY, targetX, targetY, BALL_RADIUS + TARGET_RADIUS)) {
        onHit();
        placeTarget();
        reset();
        return;
      }
      x = nextX;
      y = nextY;
      if (x > width + BALL_RADIUS || y < -BALL_RADIUS || y > height + BALL_RADIUS) {
        reset();
        return;
      }
      paint();
      frame = requestAnimationFrame(tick);
    };
    const fire = () => {
      const pullX = anchorX - x;
      const pullY = anchorY - y;
      if (pullX < 5) { reset(); return; }
      const length = Math.hypot(pullX, pullY);
      const speed = Math.min(1500, 650 + length * 6);
      vx = pullX / length * speed;
      vy = pullY / length * speed;
      flying = true;
      pointer = null;
      lastTime = 0;
      paint();
      frame = requestAnimationFrame(tick);
    };
    const drag = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      const bounds = area.getBoundingClientRect();
      x = Math.max(BALL_RADIUS, Math.min(anchorX, event.clientX - bounds.left));
      y = Math.max(BALL_RADIUS, Math.min(height - BALL_RADIUS, Math.max(anchorY - 180, Math.min(anchorY + 180, event.clientY - bounds.top))));
      paint();
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType !== 'mouse' || flying || pointer !== null) return;
      event.preventDefault();
      pointer = event.pointerId;
      ball.setPointerCapture(pointer);
      drag(event);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      drag(event);
      ball.releasePointerCapture(event.pointerId);
      fire();
    };
    const cancel = (event: PointerEvent) => { if (event.pointerId === pointer) reset(); };
    const keys = (event: KeyboardEvent) => {
      if (flying || pointer !== null) return;
      if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        event.preventDefault();
        x = Math.max(BALL_RADIUS, anchorX - 40);
        y = Math.max(anchorY - 180, Math.min(anchorY + 180, y + (event.code === 'ArrowUp' ? 16 : -16)));
        paint();
      } else if ((event.code === 'Space' || event.code === 'Enter') && !event.repeat) {
        event.preventDefault();
        x = Math.max(BALL_RADIUS, anchorX - 40);
        fire();
      }
    };
    const measure = () => {
      width = area.clientWidth;
      height = area.clientHeight;
      const areaBounds = area.getBoundingClientRect();
      const bounds = content.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(content).paddingLeft);
      const margin = bounds.left - areaBounds.left + padding;
      anchorX = Math.max(32, margin * 0.7);
      anchorY = height / 2;
      targetX = width - Math.max(26, margin * 0.5);
      placeTarget(true);
      reset();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(area);
    resize.observe(content);
    measure();
    ball.addEventListener('pointerdown', down);
    ball.addEventListener('pointermove', drag);
    ball.addEventListener('pointerup', up);
    ball.addEventListener('pointercancel', cancel);
    ball.addEventListener('lostpointercapture', cancel);
    ball.addEventListener('keydown', keys);
    window.addEventListener('blur', reset);
    const visibility = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) reset(); });
    visibility.observe(area);
    const hidden = () => { if (document.hidden) reset(); };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      resize.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', hidden);
      ball.removeEventListener('pointerdown', down);
      ball.removeEventListener('pointermove', drag);
      ball.removeEventListener('pointerup', up);
      ball.removeEventListener('pointercancel', cancel);
      ball.removeEventListener('lostpointercapture', cancel);
      ball.removeEventListener('keydown', keys);
      window.removeEventListener('blur', reset);
      reset();
    };
  }, [enabled, onHit]);

  return (
    <div className={`selected-game${enabled ? ' selected-game--enabled' : ''}`} ref={areaRef}>
      {children}
      {enabled && <div className="selected-game__layer">
        <svg ref={ropesRef} className="selected-game__ropes" aria-hidden="true"><line /><line /></svg>
        <svg ref={targetRef} className="selected-game__target" viewBox="0 0 38 38" aria-hidden="true">
          <circle cx="19" cy="19" r="18" /><circle cx="19" cy="19" r="11" /><circle cx="19" cy="19" r="4" />
        </svg>
        <button ref={ballRef} type="button" className="selected-game__ball" aria-label="Slingshot: drag left and release to shoot" title="Drag left to aim, then release. Keyboard: arrows to aim, Space to shoot." />
      </div>}
    </div>
  );
}
