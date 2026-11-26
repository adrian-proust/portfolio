import { useEffect, useRef } from 'react';

type Letter = { node: HTMLSpanElement; cx: number; cy: number; x: number; y: number; vx: number; vy: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** The orange period becomes a cursor companion, then returns to its place. */
export function useSphereInteraction() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const headline = ref.current;
    if (!headline) return;
    const ball = headline.querySelector<HTMLButtonElement>('.contact-headline__ball')!;
    const word = headline.querySelector<HTMLSpanElement>('.contact-headline__word')!;
    const home = headline.querySelector<HTMLSpanElement>('[data-sphere-home]')!;
    const letters: Letter[] = Array.from(headline.querySelectorAll<HTMLSpanElement>('[data-sphere-letter]')).map(node => ({ node, cx: 0, cy: 0, x: 0, y: 0, vx: 0, vy: 0 }));
    const media = matchMedia('(prefers-reduced-motion: no-preference)');
    let frame: number | null = null, previousTime = 0, demoUntil = 0;
    let visible = false, dragging = false;
    let pointer: { x: number; y: number } | null = null;
    let width = 1, height = 1, homeX = 0, homeY = 0;
    let x = 0, y = 0, vx = 0, vy = 0;
    const drawBall = () => { ball.style.left = `${x}px`; ball.style.top = `${y}px`; };
    const measure = () => {
      width = headline.clientWidth; height = headline.clientHeight;
      homeX = word.offsetLeft + home.offsetLeft + home.offsetWidth / 2;
      homeY = word.offsetTop + home.offsetTop + home.offsetHeight / 2;
      for (const b of letters) {
        b.cx = word.offsetLeft + b.node.offsetLeft + b.node.offsetWidth / 2;
        b.cy = word.offsetTop + b.node.offsetTop + b.node.offsetHeight / 2;
      }
    };
    const reset = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null; previousTime = demoUntil = 0; pointer = null; dragging = false;
      measure(); x = homeX; y = homeY; vx = vy = 0; drawBall();
      for (const b of letters) { b.x = b.y = b.vx = b.vy = 0; b.node.style.removeProperty('transform'); }
    };
    const tick = (time: number) => {
      const dt = previousTime ? Math.min((time - previousTime) / 16.667, 1.5) : 1;
      previousTime = time;
      const demo = time < demoUntil, active = pointer !== null || demo;
      let targetX = pointer?.x ?? homeX, targetY = pointer?.y ?? homeY;
      if (demo && !pointer) {
        targetX = homeX * (.5 + Math.sin(time * .003) * .4);
        targetY = word.offsetTop + word.offsetHeight * (.5 + Math.cos(time * .004) * .22);
      }
      vx = (vx + (targetX - x) * .065 * dt) * .8 ** dt;
      vy = (vy + (targetY - y) * .065 * dt) * .8 ** dt;
      x += vx * dt; y += vy * dt;
      let moving = demo || Math.abs(vx) + Math.abs(vy) + Math.abs(targetX-x) + Math.abs(targetY-y) > .12;
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
      return { x: clamp(event.clientX-r.left,10,width-10), y: clamp(event.clientY-r.top,10,height-10) };
    };
    const down = (event: PointerEvent) => {
      if (!media.matches || event.button !== 0 || !(event.target as Element).closest('.contact-headline__ball')) return;
      event.preventDefault(); ball.focus({preventScroll:true}); ball.setPointerCapture(event.pointerId);
      dragging = true; visible = true; pointer = local(event); wake();
    };
    const move = (event: PointerEvent) => {
      if (!media.matches || (event.pointerType !== 'mouse' && !dragging)) return;
      pointer = local(event); wake();
    };
    const release = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false; pointer = null;
      if (ball.hasPointerCapture(event.pointerId)) ball.releasePointerCapture(event.pointerId);
      wake();
    };
    const leave = () => { if (!dragging) { pointer = null; demoUntil = 0; wake(); } };
    const key = (event: KeyboardEvent) => {
      if (!media.matches || !['Enter',' ','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      if (!visible) { headline.scrollIntoView({block:'center',behavior:'instant'}); visible = true; }
      if (event.key === 'Escape') { pointer = null; demoUntil = 0; }
      else if (event.key === 'Enter' || event.key === ' ') { pointer = null; demoUntil = performance.now()+2000; }
      else pointer = { x: clamp(x+(event.key==='ArrowLeft'?-45:event.key==='ArrowRight'?45:0),10,width-10), y: clamp(y+(event.key==='ArrowUp'?-35:event.key==='ArrowDown'?35:0),10,height-10) };
      wake();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (!visible) reset(); });
    const resize = new ResizeObserver(reset);
    const hidden = () => { if (document.hidden) reset(); };
    reset(); observer.observe(headline); resize.observe(headline);
    headline.addEventListener('pointerdown',down); headline.addEventListener('pointermove',move); headline.addEventListener('pointerup',release); headline.addEventListener('pointercancel',release); headline.addEventListener('pointerleave',leave); headline.addEventListener('keydown',key);
    ball.addEventListener('blur',leave); window.addEventListener('blur',reset); document.addEventListener('visibilitychange',hidden); document.fonts.addEventListener('loadingdone',reset); media.addEventListener('change',reset);
    return () => {
      reset(); observer.disconnect(); resize.disconnect();
      headline.removeEventListener('pointerdown',down); headline.removeEventListener('pointermove',move); headline.removeEventListener('pointerup',release); headline.removeEventListener('pointercancel',release); headline.removeEventListener('pointerleave',leave); headline.removeEventListener('keydown',key);
      ball.removeEventListener('blur',leave); window.removeEventListener('blur',reset); document.removeEventListener('visibilitychange',hidden); document.fonts.removeEventListener('loadingdone',reset); media.removeEventListener('change',reset);
    };
  },[]);
  return ref;
}
