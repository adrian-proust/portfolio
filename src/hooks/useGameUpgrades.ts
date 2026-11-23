import { useState } from 'react';

export const UPGRADES_KEY = 'portfolio.ball.upgrades';
export type UpgradeId = 'double-jump';

export function useGameUpgrades() {
  const [unlocked, setUnlocked] = useState<UpgradeId[]>(() => {
    try { return JSON.parse(localStorage.getItem(UPGRADES_KEY) ?? '[]').filter((id: unknown) => id === 'double-jump'); }
    catch { return []; }
  });
  const unlock = (id: UpgradeId) => setUnlocked(current => {
    if (current.includes(id)) return current;
    const next = [...current, id];
    try { localStorage.setItem(UPGRADES_KEY, JSON.stringify(next)); } catch { /* Play remains available without storage. */ }
    return next;
  });
  return { unlocked, unlock };
}
