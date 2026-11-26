import { about, education } from '../data/portfolio';
import './Education.css';

export default function Education() {
  return (
    <section className="education about-panel" aria-labelledby="education-title">
      <h2 id="education-title" className="about-section__heading">{about.sectionNames.education}</h2>
      <ul className="education__list">
        {education.map((item) => (
          <li className="education__item reveal" key={item.degree}>
            <div className="education__qualification">
              <h3 className="education__degree">{item.degree}</h3>
              <p className="education__school">{item.school}</p>
            </div>
            <div className="education__context">
              <p className="education__status">{item.duration}</p>
              <p className="education__detail">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
