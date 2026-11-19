import { useEffect, useRef, type ReactNode } from 'react';
import './LatestProjectsPlayground.css';

const RADIUS = 14;

export default function LatestProjectsPlayground({ children }: { children: ReactNode }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const jumpRef = useRef<() => void>(() => {});

  useEffect(() => {
    const area = areaRef.current;
    const ball = ballRef.current;
    if (!area || !ball) return;

    let width = area.clientWidth;
    let height = area.clientHeight;
    let x = width * 0.18;
    let targetX = x;
    let vx = 0;
    let altitude = 48;
    let vy = 0;
    let frame = 0;
    let lastTime = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clampX = (value: number) => Math.max(RADIUS, Math.min(width - RADIUS, value));
    const paint = () => {
      ball.style.transform = `translate3d(${x - RADIUS}px, ${height - RADIUS * 2 - altitude}px, 0)`;
    };
    const tick = (now: number) => {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.032) : 1 / 60;
      lastTime = now;
      if (reducedMotion.matches) {
        x = targetX;
        vx = 0;
      } else {
        // A damped spring gives the ball weight as it follows the pointer.
        vx += ((targetX - x) * 65 - vx * 16) * dt;
        x = clampX(x + vx * dt);
      }
      vy -= 1800 * dt;
      altitude += vy * dt;
      const ceiling = Math.max(0, height - RADIUS * 2);
      if (altitude > ceiling) {
        altitude = ceiling;
        vy = Math.min(0, vy);
      }
      if (altitude <= 0) {
        altitude = 0;
        vy = 0;
      }
      paint();
      if (altitude > 0 || Math.abs(targetX - x) > 0.1 || Math.abs(vx) > 0.1) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        lastTime = 0;
      }
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const jump = () => {
      // Jump only from the ground: repeated clicks cannot escape the play area.
      if (altitude > 0.5) return;
      vy = Math.min(680, Math.sqrt(2 * 1800 * Math.max(0, height - RADIUS * 2)));
      start();
    };
    jumpRef.current = jump;

    const move = (event: PointerEvent) => {
      targetX = clampX(event.clientX - area.getBoundingClientRect().left);
      start();
    };
    const press = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as Element).closest('a, button, [role="button"]')) return;
      move(event);
      jump();
    };
    const resize = new ResizeObserver(() => {
      width = area.clientWidth;
      height = area.clientHeight;
      x = clampX(x);
      targetX = clampX(targetX);
      altitude = Math.min(altitude, Math.max(0, height - RADIUS * 2));
      paint();
    });
    resize.observe(area);
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerdown', press);
    paint();
    start();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerdown', press);
      jumpRef.current = () => {};
    };
  }, []);

  return (
    <div className="recent-playground" ref={areaRef}>
      {children}
      <div className="recent-playground__layer">
        <button
          ref={ballRef}
          type="button"
          className="project-ball"
          aria-label="Jump the orange ball"
          title="Click to jump"
          onClick={() => jumpRef.current()}
        />
      </div>
    </div>
  );
}
