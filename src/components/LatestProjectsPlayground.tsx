import { useEffect, useRef, type ReactNode } from 'react';
import { useMiniGamesEnabled } from '../hooks/useMiniGamesEnabled';
import './LatestProjectsPlayground.css';

const RADIUS = 14;

export default function LatestProjectsPlayground({ children }: { children: ReactNode }) {
  const areaRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const jumpRef = useRef<() => void>(() => {});
  const enabled = useMiniGamesEnabled();

  useEffect(() => {
    const area = areaRef.current;
    const ball = ballRef.current;
    if (!enabled || !area || !ball) return;

    let width = area.clientWidth;
    let height = area.clientHeight;
    let x = width * 0.18;
    let targetX = x;
    let vx = 0;
    let altitude = 0;
    let vy = 0;
    let frame = 0;
    let lastTime = 0;
    let held = false;
    let maxAltitude = 0;
    let scaleX = 1;
    let scaleY = 1;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Reserve room for the slight horizontal stretch at the edges.
    const clampX = (value: number) => Math.max(RADIUS * 1.16, Math.min(width - RADIUS * 1.16, value));
    const paint = () => {
      ball.style.transform = `translate3d(${x - RADIUS}px, ${height - RADIUS * 2 - altitude}px, 0) scale(${scaleX}, ${scaleY})`;
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
      // Holding sustains the ascent; releasing makes the ball fall sooner.
      vy -= (held && vy > 0 ? 1000 : 2200) * dt;
      altitude += vy * dt;
      const ceiling = maxAltitude;
      if (altitude > ceiling) {
        altitude = ceiling;
        vy = Math.min(0, vy);
      }
      if (altitude <= 0) {
        altitude = 0;
        vy = 0;
      }
      const speed = Math.min(1, Math.abs(vx) / 900);
      const airborne = altitude > 0;
      const wantedX = reducedMotion.matches ? 1 : airborne ? 0.88 : 1 + speed * 0.14;
      const wantedY = reducedMotion.matches ? 1 : airborne ? 1.12 : 1 - speed * 0.16;
      scaleX += (wantedX - scaleX) * Math.min(1, dt * 20);
      scaleY += (wantedY - scaleY) * Math.min(1, dt * 20);
      paint();
      if (altitude > 0 || Math.abs(targetX - x) > 0.1 || Math.abs(vx) > 0.1 || Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001) {
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
      vy = Math.sqrt(2 * 1000 * maxAltitude);
      start();
    };
    const release = () => {
      if (held && vy > 0) vy *= 0.5;
      held = false;
      area.classList.remove('recent-playground--holding');
    };
    jumpRef.current = () => { jump(); release(); };

    const move = (event: PointerEvent) => {
      targetX = clampX(event.clientX - area.getBoundingClientRect().left);
      start();
    };
    const press = (event: PointerEvent) => {
      const target = event.target as Element;
      if (event.pointerType !== 'mouse' || event.button !== 0 || (target.closest('a, button, [role="button"]') && !ball.contains(target))) return;
      event.preventDefault();
      held = true;
      area.classList.add('recent-playground--holding');
      move(event);
      jump();
    };
    const keyDown = (event: KeyboardEvent) => {
      if ((event.code !== 'Space' && event.code !== 'Enter') || event.repeat) return;
      event.preventDefault();
      held = true;
      jump();
    };
    const keyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      release();
    };
    const resize = new ResizeObserver(() => {
      width = area.clientWidth;
      height = area.clientHeight;
      x = clampX(x);
      targetX = clampX(targetX);
      const cards = Array.from(area.querySelectorAll('.project-card'));
      const cardsBottom = Math.max(...cards.map(card => card.getBoundingClientRect().bottom));
      // The top of the stretched ball stops just below the lowest card edge.
      maxAltitude = cards.length ? Math.max(0, area.getBoundingClientRect().bottom - cardsBottom - RADIUS * 2 * 1.12 - 4) : 0;
      altitude = Math.min(altitude, maxAltitude);
      paint();
    });
    resize.observe(area);
    const grid = area.querySelector('.project-grid');
    if (grid) resize.observe(grid);
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerdown', press);
    area.addEventListener('pointerleave', release);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    ball.addEventListener('keydown', keyDown);
    ball.addEventListener('keyup', keyUp);
    paint();
    start();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerdown', press);
      area.removeEventListener('pointerleave', release);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      ball.removeEventListener('keydown', keyDown);
      ball.removeEventListener('keyup', keyUp);
      release();
      jumpRef.current = () => {};
    };
  }, [enabled]);

  return (
    <div className="recent-playground" ref={areaRef}>
      {children}
      {enabled && <div className="recent-playground__layer">
        <button
          ref={ballRef}
          type="button"
          className="project-ball"
          aria-label="Jump the orange ball"
          title="Hold to jump higher"
          onClick={(event) => { if (event.detail === 0) jumpRef.current(); }}
        />
      </div>}
    </div>
  );
}
