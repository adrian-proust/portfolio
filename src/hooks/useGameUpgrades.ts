import { useState } from 'react';

export const UPGRADES_KEY = 'portfolio.ball.upgrades';
export type UpgradeId = 'double-jump' | 'pickup-boost' | 'air-pickup-bonus' | 'large-projectile' | 'fast-projectile';

export function useGameUpgrades() {
  const [unlocked, setUnlocked] = useState<UpgradeId[]>(() => {
    try { return JSON.parse(localStorage.getItem(UPGRADES_KEY) ?? '[]').filter((id: unknown) => ['double-jump', 'pickup-boost', 'air-pickup-bonus', 'large-projectile', 'fast-projectile'].includes(String(id))); }
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
