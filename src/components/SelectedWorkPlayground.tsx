import { useEffect, useRef, type ReactNode } from 'react';
import { segmentHitsCircle, targetDifficulty } from '../lib/slingshotGame';
import './SelectedWorkPlayground.css';

const BALL_RADIUS = 12;

export default function SelectedWorkPlayground({ children, enabled, score, onHit, onMiss }: {
  children: ReactNode; enabled: boolean; score: number; onHit: () => void; onMiss: () => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<SVGSVGElement>(null);
  const ropesRef = useRef<SVGSVGElement>(null);
  const scoreRef = useRef(score);
  const difficultyRef = useRef<() => void>(() => {});
  useEffect(() => { scoreRef.current = score; difficultyRef.current(); }, [score]);

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
    let active = true;
    let inView = true;
    let targetDirection = 1;
    let radius = targetDifficulty(scoreRef.current).radius;
    let targetSpeed = targetDifficulty(scoreRef.current).speed;
    let sideMargin = 0;
    const effects = new Set<HTMLElement>();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let growAnimation: Animation | undefined;
    let ballGrowAnimation: Animation | undefined;
    const ballCore = ball.querySelector('.selected-game__ball-core');
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
      const size = impact ? radius * 2 : 26;
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
      ballGrowAnimation?.cancel();
    };
    const lines = Array.from(ropes.querySelectorAll('line'));
    const handle = ropes.querySelector('path');
    const aim = ropes.querySelector<SVGPathElement>('.selected-game__aim');
    const paint = () => {
      ball.style.transform = `translate3d(${x - BALL_RADIUS}px, ${y - BALL_RADIUS}px, 0)`;
      target.style.transform = `translate3d(${targetX - radius}px, ${targetY - radius}px, 0)`;
      ball.dataset.state = flying ? 'flying' : pointer === null ? 'ready' : 'dragging';
      handle?.setAttribute('d', `M 0 ${anchorY} L ${anchorX - 10} ${anchorY} L ${anchorX + 14} ${anchorY - 25} M ${anchorX - 10} ${anchorY} L ${anchorX + 14} ${anchorY + 25}`);
      const pullX = anchorX - x, pullY = anchorY - y;
      const pullLength = Math.hypot(pullX, pullY);
      const aiming = pointer !== null && pullX >= 5;
      aim?.setAttribute('visibility', aiming ? 'visible' : 'hidden');
      if (aiming) aim?.setAttribute('d', `M ${x} ${y} l ${pullX / pullLength * 300} ${pullY / pullLength * 300}`);
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
      targetY = first ? anchorY : Math.max(radius, Math.min(height - radius, anchorY + (Math.random() * 2 - 1) * range));
      if (!first && Math.abs(targetY - previous) < 65) {
        targetY = Math.max(radius, Math.min(height - radius, previous <= anchorY ? anchorY + range * 0.8 : anchorY - range * 0.8));
      }
      growAnimation?.cancel();
      growAnimation = target.querySelector('g')?.animate([
        { transform: 'scale(0.05)', opacity: 0 },
        { transform: 'scale(1.12)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1)', opacity: 1 },
      ], { duration: reducedMotion.matches ? 100 : 400, easing: 'ease-out' });
    };
    const reset = (respawn = false) => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      flying = false;
      if (pointer !== null && ball.hasPointerCapture(pointer)) ball.releasePointerCapture(pointer);
      pointer = null;
      x = anchorX;
      y = anchorY;
      paint();
      ballGrowAnimation?.cancel();
      if (respawn) ballGrowAnimation = ballCore?.animate([
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.15)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1)', opacity: 1 },
      ], { duration: reducedMotion.matches ? 100 : 350, easing: 'ease-out' });
      if (active && targetSpeed > 0) start();
    };
    function start() { if (active && !frame) frame = requestAnimationFrame(tick); }
    const tick = (now: number) => {
      frame = 0;
      if (!active) return;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.032) : 1 / 60;
      lastTime = now;
      const previousTargetY = targetY;
      if (targetSpeed > 0) {
        const range = Math.min(240, height * 0.24);
        const top = Math.max(radius, anchorY - range);
        const bottom = Math.min(height - radius, anchorY + range);
        targetY += targetDirection * targetSpeed * dt;
        if (targetY >= bottom) { targetY = bottom; targetDirection = -1; }
        if (targetY <= top) { targetY = top; targetDirection = 1; }
      }
      if (!flying) { paint(); if (targetSpeed > 0) start(); return; }
      const nextX = x + vx * dt;
      const nextY = y + vy * dt;
      if (!reducedMotion.matches) {
        const length = Math.hypot(nextX - x, nextY - y);
        const trail = effect('selected-game__trail', x, y, [{ opacity: 0.7 }, { opacity: 0 }], 240);
        trail.style.width = `${length + 2}px`;
        trail.style.transform = `rotate(${Math.atan2(nextY - y, nextX - x)}rad)`;
      }
      if (segmentHitsCircle(x, y - previousTargetY, nextX, nextY - targetY, targetX, 0, BALL_RADIUS + radius)) {
        burst(targetX, targetY, true);
        onHit();
        placeTarget();
        reset(true);
        return;
      }
      if (nextX > width || nextY < 0 || nextY > height) {
        // Intersect the flight direction with the stage edge, even on a long frame.
        const exitTime = Math.min((width - x) / vx, vy > 0 ? (height - y) / vy : vy < 0 ? -y / vy : Infinity);
        const exitX = Math.max(16, Math.min(width - 16, x + vx * exitTime));
        const exitY = Math.max(18, Math.min(height - 18, y + vy * exitTime));
        effect('selected-game__death', exitX, exitY, [
          { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0 },
          { transform: 'translate(-50%, -50%) scale(1.15)', opacity: 1, offset: 0.2 },
          { transform: 'translate(-50%, -90%) scale(1)', opacity: 1, offset: 0.55 },
          { transform: 'translate(-50%, -140%) scale(0.8)', opacity: 0 },
        ], 750);
        onMiss();
        reset(true);
        return;
      }
      x = nextX;
      y = nextY;
      paint();
      start();
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
      ballGrowAnimation?.cancel();
      burst(x, y, false);
      lines.forEach(line => line.animate([{ strokeWidth: 3, opacity: 0.5 }, { strokeWidth: 1.5, opacity: 1 }], { duration: 250 }));
      pointer = null;
      lastTime = 0;
      paint();
      start();
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
      sideMargin = margin;
      const difficulty = targetDifficulty(scoreRef.current);
      radius = difficulty.radius;
      targetSpeed = difficulty.speed;
      target.style.width = target.style.height = `${radius * 2}px`;
      targetX = width - Math.max(radius + 6, margin * 0.5);
      clearEffects();
      placeTarget(true);
      reset();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(area);
    resize.observe(content);
    measure();
    difficultyRef.current = () => {
      const difficulty = targetDifficulty(scoreRef.current);
      radius = difficulty.radius;
      targetSpeed = difficulty.speed;
      target.style.width = target.style.height = `${radius * 2}px`;
      targetX = width - Math.max(radius + 6, sideMargin * 0.5);
      targetY = Math.max(radius, Math.min(height - radius, targetY));
      paint();
      if (targetSpeed > 0) start();
    };
    ball.addEventListener('pointerdown', down);
    ball.addEventListener('pointermove', drag);
    ball.addEventListener('pointerup', up);
    ball.addEventListener('pointercancel', cancel);
    ball.addEventListener('lostpointercapture', cancel);
    ball.addEventListener('keydown', keys);
    const pause = () => { active = false; reset(); clearEffects(); };
    window.addEventListener('blur', pause);
    const syncActive = () => {
      if (!inView || document.hidden) pause();
      else { active = true; lastTime = 0; if (flying || targetSpeed > 0) start(); }
    };
    const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncActive(); });
    visibility.observe(area);
    const hidden = syncActive;
    window.addEventListener('focus', syncActive);
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
      window.removeEventListener('focus', syncActive);
      difficultyRef.current = () => {};
      pause();
    };
  }, [enabled, onHit, onMiss]);

  return (
    <div className={`selected-game${enabled ? ' selected-game--enabled' : ''}`} ref={areaRef}>
      {children}
      {enabled && <div className="selected-game__layer">
        <svg ref={ropesRef} className="selected-game__ropes" aria-hidden="true"><path className="selected-game__handle" /><line /><line /><path className="selected-game__aim" visibility="hidden" /></svg>
        <svg ref={targetRef} className="selected-game__target" viewBox="0 0 38 38" aria-hidden="true">
          <g><circle cx="19" cy="19" r="18" /><circle cx="19" cy="19" r="11" /><circle cx="19" cy="19" r="2" /></g>
        </svg>
        <button ref={ballRef} type="button" className="selected-game__ball" aria-label="Slingshot: drag left and release to shoot" title="Drag left to aim, then release. Keyboard: arrows to aim, Space to shoot."><span className="selected-game__ball-core" /></button>
      </div>}
    </div>
  );
}
