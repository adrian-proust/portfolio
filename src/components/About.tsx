import { about, contact, profile, resumeLink } from '../data/portfolio';
import MarqueeBanner from './MarqueeBanner';
import Skills from './Skills';
import Education from './Education';
import Contact from './Contact';
import DesignShowcase from './DesignShowcase';
import type { Project } from '../data/types';
import './About.css';

export default function About({ onSelectProject }: { onSelectProject: (project: Project) => void }) {
  return (
    <section id="AboutMe" className="section about-section">
      <MarqueeBanner text="About me" reverse />
      <div className="container about-panels">
        <div className="about about-panel">
          <div className="about__intro">
            <h2 className="about__lead reveal">{about.lead}</h2>
            <div className="about__body">
              {about.paragraphs.map((paragraph) => (
                <p className="about__text reveal" key={paragraph.slice(0, 24)}>
                  {paragraph}
                </p>
              ))}
              <div className="about__actions reveal">
                <a className="button" href={`${import.meta.env.BASE_URL}${resumeLink.path.slice(1)}`} target="_blank" rel="noreferrer">
                  {resumeLink.label}
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg>
                </a>
                <a className="about__contact" href={`mailto:${contact.email}`}>{about.contactLabel}</a>
              </div>
              <ul className="about__languages" aria-label={about.languagesLabel}>
                {profile.languages.map((language) => <li key={language.name}>{language.name}</li>)}
              </ul>
            </div>
          </div>
        </div>
        <DesignShowcase onSelectProject={onSelectProject} />
        <Skills />
        <Education />
      </div>
      <Contact />
    </section>
  );
}
