import { useEffect, useState } from 'react';
import { upgradeNotice } from '../data/portfolio';
import './UpgradeNotice.css';
import type { MiniGame } from '../hooks/useUpgradeDiscovery';

export default function UpgradeNotice({ onClose, game }: { onClose: () => void; game: MiniGame }) {
  const [closing, setClosing] = useState(false);
  const [before, after] = upgradeNotice.message.split('upgrades');
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setClosing(true); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);

  return <aside data-game={game} className={`upgrade-notice${closing ? ' upgrade-notice--closing' : ''}`}
    aria-label="Mini-game upgrades" onAnimationEnd={(event) => {
      if (closing && event.target === event.currentTarget) onClose();
    }}>
    <button type="button" aria-label={upgradeNotice.closeLabel} onClick={() => setClosing(true)}>×</button>
    <p role="status" aria-label={upgradeNotice.message}><span aria-hidden="true">{before}<span className="upgrade-notice__word">{Array.from('upgrades').map((letter, index) => <span key={index} style={{ animationDelay: `${index * 90}ms` }}>{letter}</span>)}</span>{after}</span></p>
  </aside>;
}
