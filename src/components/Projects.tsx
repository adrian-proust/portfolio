import { useMemo, useState } from 'react';
import type { Project, ProjectCategory } from '../data/types';
import { projectCategories, projects } from '../data/portfolio';
import { useReveal } from '../hooks/useReveal';
import { useMiniGamesEnabled } from '../hooks/useMiniGamesEnabled';
import MarqueeBanner from './MarqueeBanner';
import ProjectCard from './ProjectCard';
import GameScore from './GameScore';
import './Projects.css';

const filters = projectCategories.map((category) => category.id);

type Props = {
  onSelectProject?: (project: Project) => void;
};

export default function Projects({ onSelectProject }: Props) {
  const miniGamesEnabled = useMiniGamesEnabled();
  const [filter, setFilter] = useState<ProjectCategory>(filters[0]);
  const visible = useMemo(
    () => projects.filter((p) => p.category === filter),
    [filter],
  );
  useReveal([filter]);

  return (
    <section id="Projects" className="section">
      <MarqueeBanner text="Projects" />
      <div
        className="container projects__playground"
        onPointerDown={(event) => {
          if (!miniGamesEnabled || event.pointerType !== 'mouse' || event.button !== 0) return;
          const target = event.target as Element;
          if (!target.closest('.project-card, a, button, [role="button"]')) event.preventDefault();
        }}
      >
        <div className="projects__header reveal">
          <h2 className="display-lg">
            Selected <br />
            work<span className="accent">.</span>
          </h2>
          {miniGamesEnabled && <GameScore score={0} showPickup={false} />}
        </div>

        <div className="filters reveal" role="group" aria-label="Filter projects by category">
          {filters.map((f) => (
            <button
              key={f}
              className={`filter ${filter === f ? 'is-active' : ''}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
              <span className="mono filter__count">
                {projects.filter((p) => p.category === f).length}
              </span>
            </button>
          ))}
        </div>

        <div className="project-grid">
          {visible.map((project, i) => (
            <ProjectCard
              key={project.title}
              project={project}
              index={i}
              onSelect={onSelectProject}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
