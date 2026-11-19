import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { ballTouchesSpike, ballTouchesSquare, spikeLimit } from '../lib/ballGame';
import './LatestProjectsPlayground.css';

const RADIUS = 14;
const SQUARE_SIZE = 18;
const SPIKE_WIDTH = 18;
const SPIKE_HEIGHT = 20;

type Pickup = { element: HTMLSpanElement; x: number; altitude: number; speed: number; landed: number | null };
type Pop = { element: HTMLSpanElement; age: number };
type Spike = { element: HTMLSpanElement; x: number };
type Particle = { element: HTMLSpanElement; x: number; altitude: number; vx: number; vy: number; age: number };
type Props = {
  children: ReactNode;
  enabled: boolean;
  effectsRef: RefObject<HTMLDivElement | null>;
  onCollect: () => void;
  onLose: () => void;
  score: number;
};

export default function LatestProjectsPlayground({ children, enabled, effectsRef, score, onCollect, onLose }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const jumpRef = useRef<() => void>(() => {});
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    const area = areaRef.current;
    const ball = ballRef.current;
    const effects = effectsRef.current;
    const home = area?.closest<HTMLElement>('#Home');
    const foreground = ball?.parentElement;
    if (!enabled || !area || !ball || !effects || !home || !foreground) return;

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
    let active = false;
    let inView = false;
    let untilSpawn = 0.45;
    let untilSpike = 1.8;
    let respawnLeft = 0;
    let homeHeight = home.clientHeight;
    const pickups: Pickup[] = [];
    const pops: Pop[] = [];
    const spikes: Spike[] = [];
    const particles: Particle[] = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Reserve room for the slight horizontal stretch at the edges.
    const clampX = (value: number) => Math.max(RADIUS * 1.16, Math.min(width - RADIUS * 1.16, value));
    const paint = () => {
      ball.style.transform = `translate3d(${x - RADIUS}px, ${height - RADIUS * 2 - altitude}px, 0) scale(${scaleX}, ${scaleY})`;
    };
    const tick = (now: number) => {
      frame = 0;
      if (!active) return;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.032) : 1 / 60;
      lastTime = now;
      if (respawnLeft > 0) {
        respawnLeft = Math.max(0, respawnLeft - dt);
        if (respawnLeft === 0) {
          x = targetX = clampX(width * 0.18);
          altitude = vy = vx = 0;
          scaleX = scaleY = 1;
          ball.classList.remove('project-ball--exploding');
        }
      }
      if (reducedMotion.matches) {
        x = targetX;
        vx = 0;
      } else {
        // A damped spring gives the ball weight as it follows the pointer.
        vx += ((targetX - x) * 65 - vx * 16) * dt;
        vx = Math.max(-1200, Math.min(1200, vx));
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
      untilSpawn -= dt;
      if (untilSpawn <= 0 && pickups.length < 12) {
        const element = document.createElement('span');
        element.className = 'game-pickup';
        effects.append(element);
        pickups.push({
          element,
          x: SQUARE_SIZE + Math.random() * Math.max(0, width - SQUARE_SIZE * 2),
          // Start at the top of the visible screen, even after scrolling.
          altitude: Math.max(0, area.getBoundingClientRect().bottom) + SQUARE_SIZE,
          speed: 80,
          landed: null,
        });
        untilSpawn = 1.4 + Math.random() * 0.7;
      }
      for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        if (pickup.landed === null) {
          pickup.speed = Math.min(400, pickup.speed + 320 * dt);
          pickup.altitude = Math.max(0, pickup.altitude - pickup.speed * dt);
          if (pickup.altitude === 0) {
            pickup.landed = 0;
            pickup.element.classList.add('game-pickup--landed');
          }
        } else pickup.landed += dt;

        pickup.element.style.transform = `translate3d(${pickup.x - SQUARE_SIZE / 2}px, ${homeHeight - SQUARE_SIZE - pickup.altitude}px, 0)`;
        if (respawnLeft === 0 && ballTouchesSquare(x, altitude + RADIUS * scaleY, RADIUS * scaleX, RADIUS * scaleY,
          pickup.x, pickup.altitude + SQUARE_SIZE / 2, SQUARE_SIZE)) {
          const ring = document.createElement('span');
          ring.className = 'game-pickup-pop';
          ring.style.left = `${pickup.x}px`;
          ring.style.top = `${homeHeight - pickup.altitude - SQUARE_SIZE / 2}px`;
          effects.append(ring);
          pops.push({ element: ring, age: 0 });
          pickup.element.remove();
          pickups.splice(i, 1);
          scoreRef.current += 1;
          onCollect();
        } else if (pickup.landed !== null && pickup.landed >= 0.8) {
          pickup.element.remove();
          pickups.splice(i, 1);
        }
      }
      for (let i = pops.length - 1; i >= 0; i--) {
        pops[i].age += dt;
        if (pops[i].age >= 0.45) {
          pops[i].element.remove();
          pops.splice(i, 1);
        }
      }
      const limit = spikeLimit(scoreRef.current);
      if (respawnLeft === 0 && limit > 0) {
        untilSpike -= dt;
        if (untilSpike <= 0 && spikes.length < limit) {
          const element = document.createElement('span');
          element.className = 'game-spike';
          element.setAttribute('aria-hidden', 'true');
          foreground.append(element);
          spikes.push({ element, x: width + SPIKE_WIDTH / 2 });
          untilSpike = 2.2 + Math.random() * 1.2;
        }
      } else untilSpike = 1.8;

      for (let i = spikes.length - 1; i >= 0; i--) {
        const spike = spikes[i];
        spike.x -= 145 * dt;
        spike.element.style.transform = `translate3d(${spike.x - SPIKE_WIDTH / 2}px, ${height - SPIKE_HEIGHT}px, 0)`;
        if (spike.x < -SPIKE_WIDTH) {
          spike.element.remove();
          spikes.splice(i, 1);
        } else if (respawnLeft === 0 && ballTouchesSpike(x, altitude + RADIUS * scaleY,
          RADIUS * scaleX, RADIUS * scaleY, spike.x, SPIKE_WIDTH, SPIKE_HEIGHT)) {
          // One collision ends the run; all hazards are removed together.
          for (let j = 0; j < 16; j++) {
            const angle = (j / 16) * Math.PI * 2;
            const speed = (reducedMotion.matches ? 45 : 140) + Math.random() * 100;
            const element = document.createElement('span');
            element.className = 'game-ball-particle';
            element.setAttribute('aria-hidden', 'true');
            foreground.append(element);
            particles.push({ element, x, altitude: altitude + RADIUS, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0 });
          }
          spikes.splice(0).forEach(item => item.element.remove());
          ball.classList.add('project-ball--exploding');
          respawnLeft = 0.85;
          release();
          altitude = vy = vx = 0;
          scoreRef.current = 0;
          onLose();
          break;
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.age += dt;
        particle.x += particle.vx * dt;
        particle.vy -= 600 * dt;
        particle.altitude += particle.vy * dt;
        if (particle.altitude < 3) {
          particle.altitude = 3;
          particle.vy = Math.abs(particle.vy) * 0.35;
        }
        particle.element.style.transform = `translate3d(${particle.x - 3}px, ${height - particle.altitude - 3}px, 0)`;
        particle.element.style.opacity = String(Math.max(0, 1 - particle.age / 0.75));
        if (particle.age >= 0.75) {
          particle.element.remove();
          particles.splice(i, 1);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (active && !frame) frame = requestAnimationFrame(tick);
    };
    const jump = () => {
      // Jump only from the ground: repeated clicks cannot escape the play area.
      if (respawnLeft > 0 || altitude > 0.5) return;
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
      homeHeight = home.clientHeight;
      x = clampX(x);
      targetX = clampX(targetX);
      const cards = Array.from(area.querySelectorAll('.project-card'));
      const cardsBottom = Math.max(...cards.map(card => card.getBoundingClientRect().bottom));
      // The top of the stretched ball stops just below the lowest card edge.
      maxAltitude = cards.length ? Math.max(0, area.getBoundingClientRect().bottom - cardsBottom - RADIUS * 2 * 1.12 - 4) : 0;
      altitude = Math.min(altitude, maxAltitude);
      pickups.forEach(pickup => { pickup.x = Math.min(width - SQUARE_SIZE, pickup.x); });
      paint();
    });
    resize.observe(area);
    resize.observe(home);
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
    const clearEffects = () => {
      pickups.splice(0).forEach(pickup => pickup.element.remove());
      pops.splice(0).forEach(pop => pop.element.remove());
      spikes.splice(0).forEach(spike => spike.element.remove());
      particles.splice(0).forEach(particle => particle.element.remove());
      respawnLeft = 0;
      ball.classList.remove('project-ball--exploding');
    };
    const updateActive = () => {
      active = inView && !document.hidden;
      if (active) start();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
        untilSpawn = 0.45;
        release();
        clearEffects();
      }
    };
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateActive();
    });
    visibility.observe(home);
    document.addEventListener('visibilitychange', updateActive);
    paint();
    start();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', updateActive);
      clearEffects();
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
  }, [enabled, effectsRef, onCollect, onLose]);

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
