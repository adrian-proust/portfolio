import { contactHeading } from '../data/portfolio';
import { useSphereInteraction } from '../hooks/useSphereInteraction';
import { digitalLetters, letterBars } from '../lib/digitalLetters';
import './ContactHeadline.css';

export default function ContactHeadline({ digital = false }: { digital?: boolean }) {
  const headlineRef = useSphereInteraction(digital);
  const hintId = digital ? 'contact-digital-hint' : 'contact-headline-hint';
  const characters = Array.from(digital ? contactHeading.highlight.padStart(contactHeading.digitalSlots, ' ') : contactHeading.highlight);
  return (
    <div ref={headlineRef} className={`contact-headline${digital ? ' contact-headline--digital' : ''}`}>
      <h2 aria-label={`${contactHeading.intro} ${contactHeading.highlight}.`}>
        <span className="contact-headline__intro" aria-hidden="true">{contactHeading.intro}</span>
        <span className="contact-headline__word" aria-hidden="true">
          {characters.map((character, i) => (
            digital ? (
              <svg key={i} className="contact-headline__digital-letter" viewBox="0 0 42 76" aria-hidden="true">
                {Object.entries(letterBars).map(([segment, points]) => {
                  const active = digitalLetters[character.toUpperCase()]?.includes(segment);
                  return <polygon key={segment} points={points} className={active ? undefined : 'is-unlit'} data-sphere-segment={active ? '' : undefined} />;
                })}
              </svg>) : <span className="contact-headline__letter" data-sphere-letter={character !== ' ' ? '' : undefined} key={i}>{character}</span>
          ))}
          <span className="contact-headline__period" data-sphere-home />
        </span>
      </h2>
      <button type="button" className="contact-headline__ball" aria-label={contactHeading.sphereLabel} aria-describedby={hintId} />
      <p className="sr-only" id={hintId}>{digital ? contactHeading.digitalHint : contactHeading.hint}</p>
    </div>
  );
}
