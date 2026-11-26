import { about, secondarySkills, secondarySkillsLabel, skills } from '../data/portfolio';
import './Skills.css';

export default function Skills() {
  return (
    <div className="skills about-panel">
      <section className="skills__primary" aria-labelledby="skills-title">
        <h2 id="skills-title" className="about-section__heading">{about.sectionNames.skills}</h2>
        <ul className="skills__list">
          {skills.map((skill) => (
            <li className="skills__item reveal" key={skill.name}>
              <h3 className="skills__name">{skill.name}</h3>
              <p className="skills__detail">{skill.detail}</p>
            </li>
          ))}
        </ul>

      </section>
      <section className="skills__secondary" aria-labelledby="tools-title">
          <h2 id="tools-title" className="about-section__heading">{secondarySkillsLabel}</h2>
          <ul className="skills__tools">
            {secondarySkills.map((skill) => (
              <li className="reveal" key={skill}>
                {skill}
              </li>
            ))}
          </ul>
      </section>
    </div>
  );
}
