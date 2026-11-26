import { useCallback, useMemo, useState } from 'react';
import { useGameUpgrades } from '../hooks/useGameUpgrades';
import { useUpgradeAnnouncement } from '../hooks/useUpgradeDiscovery';
import type { Project, ProjectCategory } from '../data/types';
import { projectCategories, projects } from '../data/portfolio';
import { useReveal } from '../hooks/useReveal';
import { useMiniGamesEnabled } from '../hooks/useMiniGamesEnabled';
import MarqueeBanner from './MarqueeBanner';
import ProjectCard from './ProjectCard';
import GameScore from './GameScore';
import SelectedWorkPlayground from './SelectedWorkPlayground';
import './Projects.css';

const filters = projectCategories.map((category) => category.id);

type Props = {
  onSelectProject?: (project: Project) => void;
  onMiss: (score: number) => void;
  studentVisited: boolean;
  onStudentVisit: () => void;
};

export default function Projects({ onSelectProject, onMiss, studentVisited, onStudentVisit }: Props) {
  const { unlocked } = useGameUpgrades();
  const miniGamesEnabled = useMiniGamesEnabled();
  const announcement = useUpgradeAnnouncement();
  const [gameScore, setGameScore] = useState(0);
  const hitTarget = useCallback(() => setGameScore(score => score + 1), []);
  const missTarget = useCallback((score: number) => { setGameScore(0); onMiss(score); }, [onMiss]);
  const [filter, setFilter] = useState<ProjectCategory>(filters[0]);
  const visible = useMemo(
    () => projects.filter((p) => !p.hidden && p.category === filter),
    [filter],
  );
  useReveal([filter]);

  return (
    <section
      id="Projects"
      className={`section projects-section${miniGamesEnabled ? ' projects--mouse-play' : ''}`}
      onPointerDown={(event) => {
        if (!miniGamesEnabled || event.pointerType !== 'mouse' || event.button !== 0) return;
        const target = event.target as Element;
        if (!target.closest('.project-card, a, button, [role="button"]')) event.preventDefault();
      }}
    >
      <MarqueeBanner text="Projects" />
      <SelectedWorkPlayground enabled={miniGamesEnabled} score={gameScore} onHit={hitTarget} onMiss={missTarget} giant={unlocked.includes('large-projectile')} fast={unlocked.includes('fast-projectile')}>
      <div className="container projects__playground">
        <div className="projects__header reveal">
          <h2 className="display-lg">
            Selected <br />
            work
          </h2>
          {miniGamesEnabled && <GameScore score={gameScore} game="selected-work" />}
        </div>

        <div className="filters reveal" role="group" aria-label="Filter projects by category">
          {filters.map((f) => (
            <button
              key={f}
              className={`filter ${filter === f ? 'is-active' : ''}${f === 'Student' && announcement === 'selected-work' && filter !== 'Student' && !studentVisited ? ' filter--upgrade-hint' : ''}`}
              aria-pressed={filter === f}
              onClick={() => { setFilter(f); if (f === 'Student') onStudentVisit(); }}
            >
              {f}
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
      </SelectedWorkPlayground>
    </section>
  );
}
