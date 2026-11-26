import { contactHeading } from '../data/portfolio';
import { useSphereInteraction } from '../hooks/useSphereInteraction';
import './ContactHeadline.css';

export default function ContactHeadline() {
  const headlineRef = useSphereInteraction();
  return (
    <div ref={headlineRef} className="contact-headline">
      <h2 aria-label={`${contactHeading.intro} ${contactHeading.highlight}.`}>
        <span className="contact-headline__intro" aria-hidden="true">{contactHeading.intro}</span>
        <span className="contact-headline__word" aria-hidden="true">
          {Array.from(contactHeading.highlight).map((character, i) => (
            <span className="contact-headline__letter" data-sphere-letter={character !== ' ' ? '' : undefined} key={i}>{character}</span>
          ))}
          <span className="contact-headline__period" data-sphere-home />
        </span>
      </h2>
      <button type="button" className="contact-headline__ball" aria-label={contactHeading.sphereLabel} aria-describedby="contact-headline-hint" />
      <p className="sr-only" id="contact-headline-hint">{contactHeading.hint}</p>
    </div>
  );
}
