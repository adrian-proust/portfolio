import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { contactHeading } from '../data/portfolio';
import { useSphereInteraction } from '../hooks/useSphereInteraction';
import { digitalLetters, letterBars } from '../lib/digitalLetters';
import { phraseRevealDuration, segmentRevealDelay } from '../lib/digitalDisplay';
import './ContactHeadline.css';

export default function ContactHeadline({ digital = false }: { digital?: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<'waiting' | 'playing' | 'returning' | 'revealing'>(digital ? 'waiting' : 'playing');
  const phrase = digital ? contactHeading.phrases[phraseIndex] : contactHeading.highlight;
  const clearPhrase = useCallback(() => setPhase('returning'), []);
  const nextPhrase = useCallback(() => {
    setPhraseIndex(index => (index + 1) % contactHeading.phrases.length);
    setPhase('revealing');
  }, []);
  const headlineRef = useSphereInteraction(digital, phrase, clearPhrase, nextPhrase, phase !== 'playing');
  useEffect(() => {
    if (phase !== 'waiting') return;
    const display = headlineRef.current?.querySelector('.contact-headline__word');
    if (!display) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;
      setPhase('revealing');
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(display);
    return () => observer.disconnect();
  }, [phase, headlineRef]);
  useEffect(() => {
    if (phase !== 'revealing') return;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0 : phraseRevealDuration(phrase, contactHeading.digitalSlots, phraseIndex);
    const timer = window.setTimeout(() => setPhase('playing'), duration);
    return () => window.clearTimeout(timer);
  }, [phase, phrase, phraseIndex]);
  const hintId = digital ? 'contact-digital-hint' : 'contact-headline-hint';
  const characters = Array.from(digital ? phrase.padStart(contactHeading.digitalSlots, ' ') : phrase);
  return (
    <div ref={headlineRef} className={`contact-headline${digital ? ' contact-headline--digital' : ''}`} data-display-phase={phase}>
      <h2 aria-label={phase === 'waiting' ? contactHeading.intro : `${contactHeading.intro} ${phrase}.`} aria-live="polite">
        <span className="contact-headline__intro" aria-hidden="true">{contactHeading.intro}</span>
        <span className="contact-headline__word" aria-hidden="true">
          {characters.map((character, i) => (
            digital ? (
              <svg key={`${phrase}-${i}`} className="contact-headline__digital-letter" viewBox="0 0 42 76" aria-hidden="true">
                {Object.entries(letterBars).map(([segment, points], segmentIndex) => {
                  const active = digitalLetters[character.toUpperCase()]?.includes(segment);
                  return <polygon key={segment} points={points}
                    className={!active ? 'is-unlit' : phase === 'revealing' ? 'is-revealing' : undefined}
                    style={{ '--segment-delay': `${segmentRevealDelay(i, segmentIndex, phraseIndex, contactHeading.digitalSlots)}ms` } as CSSProperties}
                    data-sphere-segment={active ? '' : undefined} />;
                })}
              </svg>) : <span className="contact-headline__letter" data-sphere-letter={character !== ' ' ? '' : undefined} key={i}>{character}</span>
          ))}
          <span className="contact-headline__period" data-sphere-home />
        </span>
      </h2>
      <button type="button" className="contact-headline__ball" aria-label={contactHeading.sphereLabel} aria-describedby={hintId} aria-disabled={phase !== 'playing'} />
      <p className="sr-only" id={hintId}>{digital ? contactHeading.digitalHint : contactHeading.hint}</p>
    </div>
  );
}
