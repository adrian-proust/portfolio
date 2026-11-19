import { useEffect, useRef, type ReactNode } from 'react';
import { segmentHitsCircle } from '../lib/slingshotGame';
import './SelectedWorkPlayground.css';

const BALL_RADIUS = 12;
const TARGET_RADIUS = 57;

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
    const effects = new Set<HTMLElement>();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let growAnimation: Animation | undefined;
    const effect = (className: string, atX: number, atY: number, frames: Keyframe[], duration: number, size?: number) => {
      const node = document.createElement('span');
      node.className = className;
      node.style.left = `${atX}px`;
      node.style.top = `${atY}px`;
      if (size) node.style.width = node.style.height = `${size}px`;
      ball.parentElement!.append(node);
      effects.add(node);
      const animation = node.animate(frames, { duration: reducedMotion.matches ? Math.min(duration, 120) : duration, easing: 'ease-out', fill: 'forwards' });
      const remove = () => { effects.delete(node); node.remove(); };
      animation.finished.then(remove, remove);
      return node;
    };
    const burst = (atX: number, atY: number, impact: boolean) => {
      const size = impact ? TARGET_RADIUS * 2 : 26;
      for (let i = 0; i < (impact ? 3 : 1); i++) {
        effect('selected-game__shockwave', atX, atY, [
          { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0.9 },
          { transform: `translate(-50%, -50%) scale(${impact ? 1.6 : 2.4})`, opacity: 0 },
        ], impact ? 450 + i * 90 : 300, size / (1 + i * 0.6));
      }
      for (let i = 0; i < (impact ? 18 : 7); i++) {
        const angle = impact ? i / 18 * Math.PI * 2 : Math.PI + (Math.random() - 0.5) * 1.6;
        const distance = reducedMotion.matches ? 8 : (impact ? 45 : 20) + Math.random() * (impact ? 65 : 20);
        effect('selected-game__spark', atX, atY, [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.2)`, opacity: 0 },
        ], impact ? 550 : 280, impact ? 3 + Math.random() * 4 : 3);
      }
    };
    const clearEffects = () => {
      for (const node of effects) { node.getAnimations().forEach(animation => animation.cancel()); node.remove(); }
      effects.clear();
      growAnimation?.cancel();
    };
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
      growAnimation?.cancel();
      growAnimation = target.querySelector('g')?.animate([
        { transform: 'scale(0.05)', opacity: 0 },
        { transform: 'scale(1.12)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1)', opacity: 1 },
      ], { duration: reducedMotion.matches ? 100 : 400, easing: 'ease-out' });
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
      if (!reducedMotion.matches) {
        const length = Math.hypot(nextX - x, nextY - y);
        const trail = effect('selected-game__trail', x, y, [{ opacity: 0.7 }, { opacity: 0 }], 240);
        trail.style.width = `${length + 2}px`;
        trail.style.transform = `rotate(${Math.atan2(nextY - y, nextX - x)}rad)`;
      }
      if (segmentHitsCircle(x, y, nextX, nextY, targetX, targetY, BALL_RADIUS + TARGET_RADIUS)) {
        burst(targetX, targetY, true);
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
      burst(x, y, false);
      lines.forEach(line => line.animate([{ strokeWidth: 3, opacity: 0.5 }, { strokeWidth: 1.5, opacity: 1 }], { duration: 250 }));
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
      targetX = width - Math.max(TARGET_RADIUS + 6, margin * 0.5);
      clearEffects();
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
    const pause = () => { reset(); clearEffects(); };
    window.addEventListener('blur', pause);
    const visibility = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); });
    visibility.observe(area);
    const hidden = () => { if (document.hidden) pause(); };
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
      window.removeEventListener('blur', pause);
      pause();
    };
  }, [enabled, onHit]);

  return (
    <div className={`selected-game${enabled ? ' selected-game--enabled' : ''}`} ref={areaRef}>
      {children}
      {enabled && <div className="selected-game__layer">
        <svg ref={ropesRef} className="selected-game__ropes" aria-hidden="true"><line /><line /></svg>
        <svg ref={targetRef} className="selected-game__target" viewBox="0 0 38 38" aria-hidden="true">
          <g><circle cx="19" cy="19" r="18" /><circle cx="19" cy="19" r="11" /><circle cx="19" cy="19" r="4" /></g>
        </svg>
        <button ref={ballRef} type="button" className="selected-game__ball" aria-label="Slingshot: drag left and release to shoot" title="Drag left to aim, then release. Keyboard: arrows to aim, Space to shoot." />
      </div>}
    </div>
  );
}
