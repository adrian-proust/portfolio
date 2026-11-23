import { useEffect, useState } from 'react';
import { upgradeNotice } from '../data/portfolio';
import './UpgradeNotice.css';

export default function UpgradeNotice({ onClose }: { onClose: () => void }) {
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setClosing(true); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);

  return <aside className={`upgrade-notice${closing ? ' upgrade-notice--closing' : ''}`}
    aria-label="Mini-game upgrades" onAnimationEnd={(event) => {
      if (closing && event.target === event.currentTarget) onClose();
    }}>
    <button type="button" aria-label={upgradeNotice.closeLabel} onClick={() => setClosing(true)}>×</button>
    <p role="status">{upgradeNotice.message}</p>
  </aside>;
}
