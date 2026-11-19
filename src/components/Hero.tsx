import { useCallback, useRef, useState } from 'react';
import type { Project, SectionId } from '../data/types';
import { homeProjects, profile, projects, RECENT_PROJECTS_COUNT } from '../data/portfolio';
import ProjectCard from './ProjectCard';
import LatestProjectsPlayground from './LatestProjectsPlayground';
import GameScore from './GameScore';
import { useMiniGamesEnabled } from '../hooks/useMiniGamesEnabled';
import './Hero.css';

type Props = {
  onNavigate: (id: SectionId) => void;
  onSelectProject?: (project: Project) => void;
};

export default function Hero({ onSelectProject }: Props) {
  const latestProjects = projects.slice(0, RECENT_PROJECTS_COUNT);
  const enabled = useMiniGamesEnabled();
  const [score, setScore] = useState(0);
  const effectsRef = useRef<HTMLDivElement>(null);
  const collect = useCallback(() => setScore(value => value + 1), []);
  const resetScore = useCallback(() => setScore(0), []);

  return (
    <section id="Home" className="section hero-section">
      {enabled && <div className="home-game-effects" ref={effectsRef} aria-hidden="true" />}
      <div className="container recent">
        <div className="recent__header reveal">
          <div className="recent__title-block">
            <h1 className="hero__title">
              {profile.firstName} <span className="hero__line--outline">{profile.lastName}</span>
            </h1>
            <p className="hero__subtitle">
              {profile.title}
              <span className="hero__languages" aria-label="Languages">
                {profile.languages.map((language) => (
                  <img key={language.name} src={`${import.meta.env.BASE_URL}${language.flag.slice(1)}`} alt={language.name} title={language.name} width="24" height="16" />
                ))}
              </span>
            </p>
          </div>
          {enabled && <GameScore score={score} game="ball" />}
        </div>
      </div>
      <LatestProjectsPlayground enabled={enabled} effectsRef={effectsRef} score={score} onCollect={collect} onLose={resetScore}>
        <div className="container recent__group">
          <div className="recent__group-header reveal">
            <h2 className="display-md">{homeProjects.title}<span className="title-dot" aria-hidden="true" /></h2>
          </div>
          <div className="project-grid">
            {latestProjects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                onSelect={onSelectProject}
              />
            ))}
          </div>
        </div>
      </LatestProjectsPlayground>
    </section>
  );
}
