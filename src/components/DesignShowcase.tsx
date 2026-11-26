import { useState, type CSSProperties } from 'react';
import { designShowcase, designShowcaseNavigation, projects } from '../data/portfolio';
import type { Project } from '../data/types';
import './DesignShowcase.css';

export default function DesignShowcase({ onSelectProject }: { onSelectProject: (project: Project) => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const item = designShowcase[index];
  const project = projects.find((entry) => entry.id === item.projectId)!;
  const move = (step: number) => {
    setDirection(step);
    setIndex((current) => (current + step + designShowcase.length) % designShowcase.length);
  };

  return (
    <section className="design-showcase about-panel" aria-labelledby="design-showcase-title" aria-roledescription="carousel"
      style={{ '--showcase-offset': `${direction * 20}px` } as CSSProperties}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          move(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <header className="design-showcase__header reveal">
        <h2 id="design-showcase-title">Design showcase</h2>
      </header>
      <div className="design-showcase__layout">
        <div className="design-showcase__viewer reveal">
          {item.presentation ? (
            <iframe key={item.projectId} className="design-showcase__image" src={project.presentations?.[0]?.embedUrl} title={`${project.title} - Presentation`} loading="lazy" allowFullScreen />
          ) : (
            <img key={item.image} className="design-showcase__image" src={`${import.meta.env.BASE_URL}${item.image.slice(1)}`} alt={item.imageAlt} loading="lazy" />
          )}
        </div>
        <div className="design-showcase__details reveal">
          <div className="design-showcase__caption" aria-live="polite" aria-atomic="true">
            <div key={item.projectId} className="design-showcase__caption-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <a className="design-showcase__link" href={`?Page=AboutMe&Project=${project.id}`} onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onSelectProject(project);
              }}>
                Explore {project.title}
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
              </a>
            </div>
          </div>
          <div className="design-showcase__controls">
            <span className="mono design-showcase__count" aria-label={`Design ${index + 1} of ${designShowcase.length}`}>{String(index + 1).padStart(2, '0')} / {String(designShowcase.length).padStart(2, '0')}</span>
            <div className="design-showcase__arrows">
              {designShowcaseNavigation.map(({ step, label }) => (
                <button key={step} type="button" className="design-showcase__arrow" aria-label={label} onClick={() => move(step)}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ transform: step === -1 ? 'rotate(180deg)' : undefined }}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
