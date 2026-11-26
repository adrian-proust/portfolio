import { contactChannels, profile } from '../data/portfolio';
import ContactHeadline from './ContactHeadline';
import MarqueeBanner from './MarqueeBanner';
import './Contact.css';
import { gameResetLabel } from '../data/portfolio';
import { UPGRADES_KEY } from '../hooks/useGameUpgrades';
import { UPGRADE_DISCOVERY_KEY, SELECTED_DISCOVERY_KEY } from '../hooks/useUpgradeDiscovery';

export default function Contact() {
  return (
    <footer className="contact">
      <MarqueeBanner text="Contact" />
      <div className="container">
        <ContactHeadline />
        <ul className="contact__list">
          {contactChannels.map((channel) => (
            <li key={channel.label}>
              <a
                className="contact__link"
                href={channel.href}
                {...(channel.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                <span className="mono contact__kind">{channel.label}</span>
                <span className="contact__value">{channel.value}</span>
                <span className="contact__arrow" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="contact__footer mono">
          <span>
            © {new Date().getFullYear()} {profile.firstName} {profile.lastName}
          </span>
          <span>{profile.title}</span>
        </div>
        <button type="button" className="game-reset mono" onClick={() => {
          for (const key of [UPGRADES_KEY, UPGRADE_DISCOVERY_KEY, SELECTED_DISCOVERY_KEY, 'portfolio.ball.highScore', 'portfolio.selected-work.highScore']) localStorage.removeItem(key);
          window.location.reload();
        }}>{gameResetLabel}</button>
      </div>
    </footer>
  );
}
