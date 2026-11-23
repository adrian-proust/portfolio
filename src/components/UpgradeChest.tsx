import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { gameUpgrades } from '../data/portfolio';
import UpgradeIcon from './UpgradeIcon';
import './UpgradeChest.css';

type Upgrade = (typeof gameUpgrades)[number];

export default function UpgradeChest({ upgrade, unlocked, onUnlock }: {
  upgrade: Upgrade; unlocked: boolean; onUnlock: () => void;
}) {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'revealed'>('closed');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (phase !== 'opening') return;
    const timer = window.setTimeout(() => setPhase('revealed'), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 650);
    return () => window.clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    if (phase === 'revealed') dialogRef.current?.showModal();
  }, [phase]);
  const close = () => {
    dialogRef.current?.close();
    setPhase('closed');
    buttonRef.current?.focus();
  };

  return <>
    <div data-game={upgrade.game} className={`upgrade-chest${unlocked ? ' upgrade-chest--unlocked' : ''}${phase === 'opening' ? ' upgrade-chest--opening' : ''}`}>
      <button ref={buttonRef} type="button" className="upgrade-chest__button" disabled={phase === 'opening'}
        aria-label={`${unlocked ? 'View' : 'Unlock'} ${upgrade.label}`} aria-haspopup="dialog"
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty('--cube-x', `${-18 - ((event.clientY - bounds.top) / bounds.height - .5) * 18}deg`);
          event.currentTarget.style.setProperty('--cube-y', `${-28 + ((event.clientX - bounds.left) / bounds.width - .5) * 26}deg`);
        }}
        onPointerLeave={(event) => { event.currentTarget.style.removeProperty('--cube-x'); event.currentTarget.style.removeProperty('--cube-y'); }}
        onClick={() => {
          if (unlocked) setPhase('revealed');
          else { setPhase('opening'); onUnlock(); }
        }}>
        <span className="upgrade-chest__sway" aria-hidden="true">
          <span className="upgrade-chest__cube">
            {['front', 'back', 'right', 'left', 'top', 'bottom'].map(face => <span key={face} className={`upgrade-chest__face upgrade-chest__face--${face}`}>{unlocked ? <UpgradeIcon id={upgrade.id} /> : '?'}</span>)}
          </span>
        </span>
      </button>
      {phase === 'opening' && <div className="upgrade-chest__burst" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ '--burst-x': `${Math.cos(i * Math.PI / 6) * 110}px`, '--burst-y': `${Math.sin(i * Math.PI / 6) * 100}px` } as CSSProperties} />)}
      </div>}
    </div>
    {phase === 'revealed' && createPortal(<dialog ref={dialogRef} data-game={upgrade.game} className="upgrade-reveal"
      aria-labelledby={`upgrade-title-${upgrade.id}`} aria-describedby={`upgrade-description-${upgrade.id}`}
      onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="upgrade-reveal__content">
        <button type="button" className="upgrade-reveal__close" aria-label="Close upgrade" onClick={close} autoFocus>×</button>
        <div className="upgrade-reveal__icon"><UpgradeIcon id={upgrade.id} /></div>
        <h2 id={`upgrade-title-${upgrade.id}`}>{upgrade.label}</h2>
        <p id={`upgrade-description-${upgrade.id}`}>{upgrade.description}</p>
      </div>
    </dialog>, document.body)}
  </>;
}
