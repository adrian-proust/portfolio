import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { ballTouchesCircle, ballTouchesSpike, ballTouchesFlyingSpike, flyingSpikeLimit, flyingSpikeAltitude, layoutBottomWithin, nextSpikeSpeed, spikeLimit, pickupScore } from '../lib/ballGame';
import './LatestProjectsPlayground.css';

const RADIUS = 14;
const PICKUP_SIZE = 18;
// Keep progress only for the current page lifetime; a refresh starts the help again.
let tutorialJumpsForPage = 0;
const SPIKE_WIDTH = 18;
const SPIKE_HEIGHT = 20;
const RESPAWN_DURATION = 1.45;
const REFORM_DURATION = 0.75;

type Pickup = { element: HTMLSpanElement; x: number; altitude: number; speed: number; landed: number | null };
type Pop = { element: HTMLSpanElement; age: number };
type Spike = { element: HTMLSpanElement; x: number; speed: number; altitude: number; flying: boolean };
type Particle = { element: HTMLSpanElement; x: number; altitude: number; vx: number; vy: number; age: number };
type ReformParticle = { element: HTMLSpanElement; dx: number; dy: number };
type Props = {
  children: ReactNode;
  enabled: boolean;
  effectsRef: RefObject<HTMLDivElement | null>;
  onCollect: (points: number) => void;
  onLose: () => void;
  score: number;
  doubleJump: boolean;
  pickupBoost: boolean;
  airPickupBonus: boolean;
};

export default function LatestProjectsPlayground({ children, enabled, effectsRef, score, onCollect, onLose, doubleJump, pickupBoost, airPickupBonus }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLButtonElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const tutorialJumpsRef = useRef(tutorialJumpsForPage);
  const jumpRef = useRef<() => void>(() => {});
  const scoreRef = useRef(score);
  const doubleJumpRef = useRef(doubleJump);
  const pickupBoostRef = useRef(pickupBoost);
  const airPickupBonusRef = useRef(airPickupBonus);
  useEffect(() => { airPickupBonusRef.current = airPickupBonus; }, [airPickupBonus]);
  useEffect(() => { pickupBoostRef.current = pickupBoost; }, [pickupBoost]);
  useEffect(() => { doubleJumpRef.current = doubleJump; }, [doubleJump]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    const area = areaRef.current;
    const ball = ballRef.current;
    const hint = hintRef.current;
    const effects = effectsRef.current;
    const home = area?.closest<HTMLElement>('#Home');
    const foreground = ball?.parentElement;
    if (!enabled || !area || !ball || !hint || !effects || !home || !foreground) return;

    let width = area.clientWidth;
    let height = area.clientHeight;
    let x = width * 0.18;
    let targetX = x;
    let vx = 0;
    let altitude = 0;
    let vy = 0;
    let jumpsUsed = 0;
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
    let untilFlyingSpike = 0;
    let respawnLeft = 0;
    let homeHeight = home.clientHeight;
    const pickups: Pickup[] = [];
    const pops: Pop[] = [];
    const spikes: Spike[] = [];
    const particles: Particle[] = [];
    const reformParticles: ReformParticle[] = [];
    let reformCore: HTMLSpanElement | null = null;
    const clickRipples: Pop[] = [];
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
        if (respawnLeft > 0 && respawnLeft <= REFORM_DURATION) {
          if (reformParticles.length === 0) {
            for (let i = 0; i < 12; i++) {
              const angle = ((i + 0.5) / 12) * Math.PI;
              const distance = reducedMotion.matches ? 14 : 36 + Math.random() * 28;
              const element = document.createElement('span');
              element.className = 'game-ball-particle game-ball-reform';
              element.setAttribute('aria-hidden', 'true');
              foreground.append(element);
              reformParticles.push({ element, dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance });
            }
            reformCore = document.createElement('span');
            reformCore.className = 'game-ball-reform-core';
            reformCore.setAttribute('aria-hidden', 'true');
            foreground.append(reformCore);
          }
          const progress = 1 - respawnLeft / REFORM_DURATION;
          const convergence = progress * progress * (3 - 2 * progress);
          const respawnX = clampX(width * 0.18);
          for (const particle of reformParticles) {
            const px = respawnX + particle.dx * (1 - convergence);
            const py = height - RADIUS - particle.dy * (1 - convergence);
            particle.element.style.transform = `translate3d(${px - 3}px, ${py - 3}px, 0)`;
            particle.element.style.opacity = String(Math.min(1, progress / 0.3) * (1 - progress * 0.3));
          }
          if (reformCore) {
            const growth = progress * progress;
            reformCore.style.transform = `translate3d(${respawnX - RADIUS}px, ${height - RADIUS * 2}px, 0) scale(${growth})`;
            reformCore.style.opacity = String(growth);
          }
        }
        if (respawnLeft === 0) {
          reformParticles.splice(0).forEach(particle => particle.element.remove());
          reformCore?.remove();
          reformCore = null;
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
      const gravity = held && vy > 0 ? 1000 : 2200;
      altitude += vy * dt - 0.5 * gravity * dt * dt;
      vy -= gravity * dt;
      const ceiling = maxAltitude;
      if (altitude > ceiling) {
        altitude = ceiling;
        vy = Math.min(0, vy);
      }
      if (altitude <= 0) {
        altitude = 0;
        vy = 0;
        jumpsUsed = 0;
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
          x: PICKUP_SIZE + Math.random() * Math.max(0, width - PICKUP_SIZE * 2),
          // Start at the top of the visible screen, even after scrolling.
          altitude: Math.max(0, area.getBoundingClientRect().bottom) + PICKUP_SIZE,
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

        pickup.element.style.transform = `translate3d(${pickup.x - PICKUP_SIZE / 2}px, ${homeHeight - PICKUP_SIZE - pickup.altitude}px, 0)`;
        if (respawnLeft === 0 && ballTouchesCircle(x, altitude + RADIUS * scaleY, RADIUS * scaleX, RADIUS * scaleY,
          pickup.x, pickup.altitude + PICKUP_SIZE / 2, PICKUP_SIZE / 2)) {
          const ring = document.createElement('span');
          ring.className = 'game-pickup-pop';
          ring.style.left = `${pickup.x}px`;
          ring.style.top = `${homeHeight - pickup.altitude - PICKUP_SIZE / 2}px`;
          effects.append(ring);
          pops.push({ element: ring, age: 0 });
          pickup.element.remove();
          pickups.splice(i, 1);
          const points = pickupScore(airPickupBonusRef.current, altitude, pickup.landed === null);
          if (points === 2) {
            const feedback = document.createElement('span');
            feedback.className = 'game-air-bonus';
            feedback.textContent = '2x';
            feedback.setAttribute('aria-hidden', 'true');
            feedback.style.left = `${pickup.x}px`;
            feedback.style.top = `${height - pickup.altitude - PICKUP_SIZE / 2}px`;
            foreground.append(feedback);
            clickRipples.push({ element: feedback, age: 0 });
          }
          scoreRef.current += points;
          onCollect(points);
        } else if (pickup.landed !== null && pickup.landed >= (pickupBoostRef.current ? 1.2 : 0.8)) {
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
      for (let i = clickRipples.length - 1; i >= 0; i--) {
        clickRipples[i].age += dt;
        if (clickRipples[i].age >= 0.45) {
          clickRipples[i].element.remove();
          clickRipples.splice(i, 1);
        }
      }
      const limit = spikeLimit(scoreRef.current);
      if (respawnLeft === 0 && limit > 0) {
        untilSpike -= dt;
        if (untilSpike <= 0 && spikes.filter(spike => !spike.flying).length < limit) {
          const element = document.createElement('span');
          element.className = 'game-spike';
          element.setAttribute('aria-hidden', 'true');
          foreground.append(element);
          const previousSpeed = spikes.at(-1)?.speed ?? 160;
          const speed = nextSpikeSpeed(previousSpeed);
          spikes.push({ element, x: width + SPIKE_WIDTH / 2, speed, altitude: 0, flying: false });
          untilSpike = 2.2 + Math.random() * 1.2;
        }
      } else untilSpike = 1.8;

      const flyingLimit = flyingSpikeLimit(scoreRef.current);
      if (respawnLeft === 0 && flyingLimit > 0) {
        untilFlyingSpike -= dt;
        if (untilFlyingSpike <= 0 && spikes.filter(spike => spike.flying).length < flyingLimit) {
          const element = document.createElement('span');
          element.className = 'game-spike game-spike--flying';
          element.setAttribute('aria-hidden', 'true');
          foreground.append(element);
          spikes.push({ element, x: -SPIKE_HEIGHT / 2, speed: nextSpikeSpeed(spikes.at(-1)?.speed ?? 160),
            altitude: flyingSpikeAltitude(maxAltitude + RADIUS * 2 * 1.12, SPIKE_WIDTH), flying: true });
          untilFlyingSpike = 2.4 + Math.random();
        }
      } else untilFlyingSpike = 0;

      for (let i = spikes.length - 1; i >= 0; i--) {
        const spike = spikes[i];
        spike.x += (spike.flying ? 1 : -1) * spike.speed * dt;
        spike.altitude = spike.flying ? Math.min(spike.altitude, maxAltitude + RADIUS * 2 * 1.12 - SPIKE_WIDTH / 2 - 3) : 0;
        spike.element.style.transform = spike.flying
          ? `translate3d(${spike.x - SPIKE_HEIGHT / 2}px, ${height - spike.altitude - SPIKE_WIDTH / 2}px, 0)`
          : `translate3d(${spike.x - SPIKE_WIDTH / 2}px, ${height - SPIKE_HEIGHT}px, 0)`;
        if (spike.flying ? spike.x > width + SPIKE_HEIGHT : spike.x < -SPIKE_WIDTH) {
          spike.element.remove();
          spikes.splice(i, 1);
        } else if (respawnLeft === 0 && (spike.flying
          ? ballTouchesFlyingSpike(x, altitude + RADIUS * scaleY, RADIUS * scaleX, RADIUS * scaleY, spike.x, spike.altitude, SPIKE_HEIGHT, SPIKE_WIDTH)
          : ballTouchesSpike(x, altitude + RADIUS * scaleY, RADIUS * scaleX, RADIUS * scaleY, spike.x, SPIKE_WIDTH, SPIKE_HEIGHT))) {
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
          hint.hidden = true;
          respawnLeft = RESPAWN_DURATION;
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
      if (respawnLeft > 0) return;
      const airborne = altitude > 0.5 || vy > 0;
      if (airborne && (!doubleJumpRef.current || jumpsUsed >= 2)) return;
      measure();
      if (maxAltitude <= 0) return;
      jumpsUsed = airborne ? 2 : 1;
      vy = Math.sqrt(2 * 1000 * Math.max(0, maxAltitude - altitude));
      if (airborne) {
        const element = document.createElement('span');
        element.className = 'game-jump-ripple game-upgrade-ripple';
        element.setAttribute('aria-hidden', 'true');
        element.style.left = `${x}px`;
        element.style.top = `${height - RADIUS - altitude}px`;
        foreground.append(element);
        clickRipples.push({ element, age: 0 });
        for (let i = 0; i < 8; i++) {
          const spark = document.createElement('span');
          const angle = i * Math.PI / 4;
          spark.className = 'game-upgrade-spark';
          spark.setAttribute('aria-hidden', 'true');
          spark.style.left = `${x}px`;
          spark.style.top = `${height - RADIUS - altitude}px`;
          spark.style.setProperty('--spark-x', `${Math.cos(angle) * 42}px`);
          spark.style.setProperty('--spark-y', `${Math.sin(angle) * 30}px`);
          foreground.append(spark);
          clickRipples.push({ element: spark, age: 0 });
        }
      }
      tutorialJumpsRef.current = Math.min(5, tutorialJumpsRef.current + 1);
      tutorialJumpsForPage = tutorialJumpsRef.current;
      if (tutorialJumpsRef.current >= 5) {
        hint.hidden = true;
        for (let i = clickRipples.length - 1; i >= 0; i--) {
          if (clickRipples[i].element.className === 'game-jump-ripple') {
            clickRipples[i].element.remove();
            clickRipples.splice(i, 1);
          }
        }
      }
      start();
    };
    const release = () => {
      if (held && vy > 0) vy *= 0.5;
      held = false;
      area.classList.remove('recent-playground--holding');
    };
    jumpRef.current = () => { jump(); release(); };

    const move = (event: PointerEvent) => {
      const bounds = area.getBoundingClientRect();
      targetX = clampX(event.clientX - bounds.left);
      const onCard = (event.target as Element).closest('.project-card');
      hint.hidden = event.pointerType !== 'mouse' || Boolean(onCard) || tutorialJumpsRef.current >= 5 || respawnLeft > 0;
      if (!hint.hidden) {
        const hintX = Math.max(24, Math.min(width - 24, event.clientX - bounds.left));
        const hintY = Math.max(24, Math.min(height - 18, event.clientY - bounds.top - 18));
        hint.style.transform = `translate3d(${hintX}px, ${hintY}px, 0) translate(-50%, -100%)`;
      }
      start();
    };
    const press = (event: PointerEvent) => {
      const target = event.target as Element;
      if (event.pointerType !== 'mouse' || event.button !== 0 || (target.closest('a, button, [role="button"]') && !ball.contains(target))) return;
      event.preventDefault();
      held = true;
      area.classList.add('recent-playground--holding');
      move(event);
      if (tutorialJumpsRef.current < 5) {
        const bounds = area.getBoundingClientRect();
        const element = document.createElement('span');
        element.className = 'game-jump-ripple';
        element.style.left = `${event.clientX - bounds.left}px`;
        element.style.top = `${event.clientY - bounds.top}px`;
        foreground.append(element);
        clickRipples.push({ element, age: 0 });
      }
      jump();
    };
    const keyDown = (event: KeyboardEvent) => {
      if ((event.code !== 'Space' && event.code !== 'Enter') || event.repeat) return;
      event.stopPropagation();
      event.preventDefault();
      held = true;
      jump();
    };
    const keyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.code !== 'Enter') return;
      event.preventDefault();
      release();
    };
    const measure = () => {
      width = area.clientWidth;
      height = area.clientHeight;
      homeHeight = home.clientHeight;
      x = clampX(x);
      targetX = clampX(targetX);
      const cards = Array.from(area.querySelectorAll<HTMLElement>('.project-card'));
      const cardsBottom = Math.max(...cards.map(card => layoutBottomWithin(card, area)));
      // The top of the stretched ball stops just below the lowest card edge.
      maxAltitude = cards.length ? Math.max(0, height - cardsBottom - RADIUS * 2 * 1.12 - 4) : 0;
      altitude = Math.min(altitude, maxAltitude);
      pickups.forEach(pickup => { pickup.x = Math.min(width - PICKUP_SIZE, pickup.x); });
      paint();
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(area);
    resize.observe(home);
    const grid = area.querySelector('.project-grid');
    if (grid) resize.observe(grid);
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerdown', press);
    const leave = () => { release(); hint.hidden = true; };
    area.addEventListener('pointerleave', leave);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', leave);
    ball.addEventListener('keydown', keyDown);
    ball.addEventListener('keyup', keyUp);
    const clearEffects = () => {
      pickups.splice(0).forEach(pickup => pickup.element.remove());
      pops.splice(0).forEach(pop => pop.element.remove());
      spikes.splice(0).forEach(spike => spike.element.remove());
      particles.splice(0).forEach(particle => particle.element.remove());
      reformParticles.splice(0).forEach(particle => particle.element.remove());
      reformCore?.remove();
      reformCore = null;
      clickRipples.splice(0).forEach(ripple => ripple.element.remove());
      hint.hidden = true;
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
      area.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', leave);
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
        <span ref={hintRef} className="game-jump-hint" aria-hidden="true" hidden>jump</span>
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
