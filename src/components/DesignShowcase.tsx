import { useState } from 'react';
import { designShowcase, projects } from '../data/portfolio';
import type { Project } from '../data/types';
import './DesignShowcase.css';

export default function DesignShowcase({ onSelectProject }: { onSelectProject: (project: Project) => void }) {
  const [index, setIndex] = useState(0);
  const item = designShowcase[index];
  const project = projects.find((entry) => entry.id === item.projectId)!;
  const move = (direction: number) => setIndex((current) => (current + direction + designShowcase.length) % designShowcase.length);

  return (
    <section className="design-showcase about-panel" aria-labelledby="design-showcase-title" aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          move(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <header className="design-showcase__header">
        <h2 id="design-showcase-title">Design showcase<span className="title-dot" aria-hidden="true" /></h2>
        <span className="mono" aria-label={`Design ${index + 1} of ${designShowcase.length}`}>{String(index + 1).padStart(2, '0')} / {String(designShowcase.length).padStart(2, '0')}</span>
      </header>
      <div className="design-showcase__viewer">
        <button type="button" className="design-showcase__arrow" aria-label="Previous design" onClick={() => move(-1)}>←</button>
        <img key={item.image} className="design-showcase__image" src={`${import.meta.env.BASE_URL}${item.image.slice(1)}`} alt={item.imageAlt} loading="lazy" />
        <button type="button" className="design-showcase__arrow" aria-label="Next design" onClick={() => move(1)}>→</button>
      </div>
      <div className="design-showcase__caption" aria-live="polite" aria-atomic="true">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <a className="link-arrow mono" href={`?Page=AboutMe&Project=${project.id}`} onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          onSelectProject(project);
        }}>Explore {project.title} <span aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}
