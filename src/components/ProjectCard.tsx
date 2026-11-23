import type { Project } from '../data/types';
import type { UpgradeId } from '../hooks/useGameUpgrades';
import './ProjectCard.css';

type Props = {
  project: Project;
  index: number;
  onSelect?: (project: Project) => void;
  upgrade?: { id: UpgradeId; label: string; description: string };
  unlocked?: boolean;
  onUnlock?: (id: UpgradeId) => void;
};

const badgeModifier = (category: Project['category']) =>
  category.toLowerCase().replace(/\s+/g, '-');

export default function ProjectCard({ project, index, onSelect, upgrade, unlocked, onUnlock }: Props) {
  const imageSrc = project.image.startsWith('/')
    ? `${import.meta.env.BASE_URL}${project.image.slice(1)}`
    : project.image;

  const handleClick = () => {
    onSelect?.(project);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(project);
    }
  };

  return (
    <article
      className={`project-card reveal ${onSelect ? 'project-card--interactive' : ''}`}
      style={{ transitionDelay: `${(index % 3) * 90}ms` }}
    >
      <div className="project-card__main" tabIndex={0} role={onSelect ? 'button' : undefined} onClick={handleClick} onKeyDown={handleKeyDown}>
      <div className="project-card__media">
        <img src={imageSrc} alt={project.imageAlt} loading="lazy" />
        <div className="project-card__overlay">
          <p className="project-card__desc">{project.description}</p>
          <ul className="chips" aria-label="Role and tags">
            <li className="chip chip--role">{project.role}</li>
            {project.tags.map((tag) => (
              <li className="chip" key={tag}>
                {tag}
              </li>
            ))}
          </ul>
          {onSelect && (
            <span className="project-card__cta mono">
              View project details →
            </span>
          )}
        </div>
      </div>
      <div className="project-card__body">
        <header className="project-card__top">
          <span className={`badge badge--${badgeModifier(project.category)}`}>
            {project.category}
          </span>
          <span className="mono project-card__index">{String(index + 1).padStart(2, '0')}</span>
        </header>
        <h3 className="project-card__title">{project.title}</h3>
        <p className="mono project-card__duration">{project.duration}</p>
      </div>
      </div>
      {upgrade && <button type="button" className={`project-card__upgrade${unlocked ? ' is-unlocked' : ''}`} aria-pressed={Boolean(unlocked)} title={upgrade.description} onClick={() => onUnlock?.(upgrade.id)}>
        <span>{upgrade.label}{unlocked ? ' ✓' : ''}</span>
        <svg viewBox="0 0 64 44" width="48" height="34" fill="none" aria-hidden="true">
          <path d="M3 39h58M9 34Q16 9 28 30Q34 5 47 9" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          <path d="m41 6 8 2-3 8" stroke="currentColor" strokeWidth="2" />
          <circle cx="10" cy="32" r="4" fill="currentColor" opacity=".4" /><circle cx="29" cy="29" r="4" fill="currentColor" opacity=".65" /><circle cx="52" cy="7" r="5" fill="currentColor" />
        </svg>
      </button>}
    </article>
  );
}
