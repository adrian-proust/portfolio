import { useEffect, useRef } from 'react';
import { segmentContact, type Point } from '../lib/digitalLetters';

type Letter = { node: HTMLSpanElement; cx: number; cy: number; x: number; y: number; vx: number; vy: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** The orange period becomes a cursor companion, then returns to its place. */
export function useSphereInteraction(digital = false, phrase = '', onCleared?: () => void, onReturned?: () => void, locked = false) {
  const ref = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  useEffect(() => {
    const headline = ref.current;
    if (!headline) return;
    const ball = headline.querySelector<HTMLButtonElement>('.contact-headline__ball')!;
    const word = headline.querySelector<HTMLSpanElement>('.contact-headline__word')!;
    const home = headline.querySelector<HTMLSpanElement>('[data-sphere-home]')!;
    const letters: Letter[] = Array.from(headline.querySelectorAll<HTMLSpanElement>('[data-sphere-letter]')).map(node => ({ node, cx: 0, cy: 0, x: 0, y: 0, vx: 0, vy: 0 }));
    const bars = Array.from(headline.querySelectorAll<SVGPolygonElement>('[data-sphere-segment]')).map(node => ({ node, vertices: [] as Point[], disabled: false }));
    let cleared = false, returning = false, returnNotBefore = 0;
    let capturedPointer: number | null = null;
    const media = matchMedia('(prefers-reduced-motion: no-preference)');
    let frame: number | null = null, previousTime = 0, demoUntil = 0;
    let visible = false, dragging = false;
    let pointer: { x: number; y: number } | null = null;
    let height = 1, homeX = 0, homeY = 0;
    let x = 0, y = 0, vx = 0, vy = 0, ballRadius = 9;
    const dropCapture = () => {
      if (capturedPointer !== null && ball.hasPointerCapture(capturedPointer)) ball.releasePointerCapture(capturedPointer);
      capturedPointer = null;
    };
    const horizontalBounds = () => {
      const left = headline.getBoundingClientRect().left;
      return { min: ballRadius - left, max: document.documentElement.clientWidth - ballRadius - left };
    };
    const drawBall = () => { ball.style.left = `${x}px`; ball.style.top = `${y}px`; };
    const measure = () => {
      height = headline.clientHeight;
      homeX = word.offsetLeft + home.offsetLeft + home.offsetWidth / 2;
      homeY = word.offsetTop + home.offsetTop + home.offsetHeight / 2;
      ballRadius = parseFloat(getComputedStyle(ball, '::before').width) / 2;
      const origin = headline.getBoundingClientRect();
      for (const bar of bars) {
        const matrix = bar.node.getScreenCTM();
        bar.vertices = matrix ? Array.from(bar.node.points).map(point => {
          const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix);
          return { x: screen.x - origin.left, y: screen.y - origin.top };
        }) : [];
      }
      for (const b of letters) {
        b.cx = word.offsetLeft + b.node.offsetLeft + b.node.offsetWidth / 2;
        b.cy = word.offsetTop + b.node.offsetTop + b.node.offsetHeight / 2;
      }
    };
    const reset = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null; previousTime = demoUntil = 0; pointer = null; dragging = false;
      dropCapture();
      for (const bar of bars) bar.node.classList.remove('is-hit');
      measure(); x = homeX; y = homeY; vx = vy = 0; drawBall();
      for (const b of letters) { b.x = b.y = b.vx = b.vy = 0; b.node.style.removeProperty('transform'); }
      if (returning && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const tick = (time: number) => {
      const dt = previousTime ? Math.min((time - previousTime) / 16.667, 1.5) : 1;
      previousTime = time;
      const canControl = !lockedRef.current && !returning && !cleared;
      const demo = canControl && time < demoUntil, active = canControl && (pointer !== null || demo);
      let targetX = active ? pointer?.x ?? homeX : homeX, targetY = active ? pointer?.y ?? homeY : homeY;
      if (demo && !pointer) {
        targetX = homeX * (.5 + Math.sin(time * .003) * .4);
        targetY = word.offsetTop + word.offsetHeight * (.5 + Math.cos(time * .004) * .22);
      }
      vx = (vx + (targetX - x) * .065 * dt) * .8 ** dt;
      vy = (vy + (targetY - y) * .065 * dt) * .8 ** dt;
      if (digital) {
        // Sweep in small steps so quick pointer movements cannot skip a thin bar.
        const steps = Math.max(1, Math.ceil(Math.hypot(vx, vy) * dt / (ballRadius * 0.6)));
        for (let step = 0; step < steps; step++) {
          x += vx * dt / steps; y += vy * dt / steps;
          if (!active) continue;
          for (const bar of bars) {
            if (bar.disabled || bar.vertices.length === 0) continue;
            const contact = segmentContact(x, y, ballRadius, bar.vertices);
            if (!contact) continue;
            x += contact.nx * (contact.depth + 0.5);
            y += contact.ny * (contact.depth + 0.5);
            const incoming = vx * contact.nx + vy * contact.ny;
            const impulse = Math.max(8, -incoming * 1.7);
            vx += impulse * contact.nx;
            vy += impulse * contact.ny;
            bar.disabled = true;
            bar.node.classList.add('is-disabled', 'is-hit');
          }
        }
        if (bars.length > 0 && bars.every(bar => bar.disabled) && !cleared && onCleared) {
          cleared = true;
          returning = true;
          returnNotBefore = time + 360;
          pointer = null; demoUntil = 0; dragging = false;
          dropCapture();
          onCleared();
        }
      } else { x += vx * dt; y += vy * dt; }
      const bounds = horizontalBounds();
      if (x < bounds.min || x > bounds.max) {
        x = clamp(x, bounds.min, bounds.max);
        vx *= -0.35;
      }
      const settled = Math.abs(vx) + Math.abs(vy) + Math.abs(homeX-x) + Math.abs(homeY-y) <= .12;
      if (returning && settled && time >= returnNotBefore) {
        returning = false;
        x = homeX; y = homeY; vx = vy = 0;
        drawBall(); frame = null; previousTime = 0;
        onReturned?.();
        return;
      }
      let moving = returning || demo || Math.abs(vx) + Math.abs(vy) + Math.abs(targetX-x) + Math.abs(targetY-y) > .12;
      const reach = Math.max(75, Math.min(170,word.offsetHeight*.75));
      for (const b of letters) {
        const dx = b.cx - x, dy = b.cy - y, distance = Math.max(1,Math.hypot(dx,dy));
        const force = active ? Math.max(0,1-distance/reach) ** 2 * 28 : 0;
        const tx = dx/distance*force, ty = dy/distance*force;
        b.vx = (b.vx + (tx-b.x)*.1*dt)*.76**dt;
        b.vy = (b.vy + (ty-b.y)*.1*dt)*.76**dt;
        b.x += b.vx*dt; b.y += b.vy*dt;
        b.node.style.transform = `translate3d(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px,0) rotate(${(b.x*.12).toFixed(2)}deg)`;
        moving ||= Math.abs(b.vx)+Math.abs(b.vy)+Math.abs(tx-b.x)+Math.abs(ty-b.y) > .1;
      }
      drawBall();
      if (moving) frame = requestAnimationFrame(tick);
      else {
        frame = null; previousTime = 0;
        if (!active) reset();
      }
    };
    const wake = () => {
      if (frame !== null || !media.matches) return;
      if (!visible) { const r = headline.getBoundingClientRect(); visible = r.bottom > 0 && r.top < innerHeight; }
      if (visible) frame = requestAnimationFrame(tick);
    };
    const local = (event: PointerEvent) => {
      const r = headline.getBoundingClientRect();
      const bounds = horizontalBounds();
      return { x: clamp(event.clientX-r.left,bounds.min,bounds.max), y: clamp(event.clientY-r.top,10,height-10) };
    };
    const down = (event: PointerEvent) => {
      if (lockedRef.current || cleared || !media.matches || event.button !== 0 || !(event.target as Element).closest('.contact-headline__ball')) return;
      event.preventDefault(); ball.focus({preventScroll:true}); ball.setPointerCapture(event.pointerId);
      capturedPointer = event.pointerId;
      dragging = true; visible = true; pointer = local(event); wake();
    };
    const move = (event: PointerEvent) => {
      if (lockedRef.current || cleared || !media.matches || (event.pointerType !== 'mouse' && !dragging)) return;
      const bounds = headline.getBoundingClientRect();
      if (!dragging && (event.clientY < bounds.top || event.clientY > bounds.bottom)) { leave(); return; }
      pointer = local(event); wake();
    };
    const release = () => {
      if (!dragging) return;
      dragging = false; pointer = null;
      dropCapture();
      wake();
    };
    const leave = () => { if (!dragging) { pointer = null; demoUntil = 0; wake(); } };
    const key = (event: KeyboardEvent) => {
      if (!media.matches || !['Enter',' ','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      if (lockedRef.current || cleared) return;
      if (!visible) { headline.scrollIntoView({block:'center',behavior:'instant'}); visible = true; }
      if (event.key === 'Escape') { pointer = null; demoUntil = 0; }
      else if (event.key === 'Enter' || event.key === ' ') { pointer = null; demoUntil = performance.now()+2000; }
      else {
        const bounds = horizontalBounds();
        pointer = { x: clamp(x+(event.key==='ArrowLeft'?-45:event.key==='ArrowRight'?45:0),bounds.min,bounds.max), y: clamp(y+(event.key==='ArrowUp'?-35:event.key==='ArrowDown'?35:0),10,height-10) };
      }
      wake();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) reset(); else if (returning) wake(); });
    const resize = new ResizeObserver(reset);
    const hidden = () => { if (document.hidden) reset(); else if (returning) wake(); };
    reset(); observer.observe(headline); resize.observe(headline);
    headline.addEventListener('pointerdown',down); window.addEventListener('pointermove',move); headline.addEventListener('pointerup',release); headline.addEventListener('pointercancel',release); headline.addEventListener('keydown',key);
    ball.addEventListener('blur',leave); window.addEventListener('blur',reset); document.addEventListener('visibilitychange',hidden); document.fonts.addEventListener('loadingdone',reset); media.addEventListener('change',reset);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      dropCapture(); observer.disconnect(); resize.disconnect();
      headline.removeEventListener('pointerdown',down); window.removeEventListener('pointermove',move); headline.removeEventListener('pointerup',release); headline.removeEventListener('pointercancel',release); headline.removeEventListener('keydown',key);
      ball.removeEventListener('blur',leave); window.removeEventListener('blur',reset); document.removeEventListener('visibilitychange',hidden); document.fonts.removeEventListener('loadingdone',reset); media.removeEventListener('change',reset);
    };
  },[digital, phrase, onCleared, onReturned]);
  return ref;
}
