import type { UpgradeId } from '../hooks/useGameUpgrades';
import DoubleJumpIcon from './DoubleJumpIcon';

export default function UpgradeIcon({ id }: { id: UpgradeId }) {
  if (id === 'double-jump') return <DoubleJumpIcon />;
  if (id === 'air-pickup-bonus') return <svg viewBox="0 0 64 44" width="48" height="34" fill="none" aria-hidden="true">
    <circle cx="18" cy="15" r="10" stroke="currentColor" strokeWidth="2" /><circle cx="18" cy="15" r="3" fill="currentColor" />
    <path d="M3 36h57" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
    <text x="31" y="25" fill="currentColor" fontSize="21" fontFamily="monospace" fontWeight="bold">2x</text>
  </svg>;
  return <svg viewBox="0 0 64 44" width="48" height="34" fill="none" aria-hidden="true">
    <circle cx="26" cy="25" r="15" stroke="currentColor" strokeWidth="2" />
    <circle cx="26" cy="25" r="5" fill="currentColor" />
    <path d="M48 3v16M40 11h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}
