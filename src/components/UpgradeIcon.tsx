import type { UpgradeId } from '../hooks/useGameUpgrades';
import DoubleJumpIcon from './DoubleJumpIcon';

export default function UpgradeIcon({ id }: { id: UpgradeId }) {
  if (id === 'double-jump') return <DoubleJumpIcon />;
  return <svg viewBox="0 0 64 44" width="48" height="34" fill="none" aria-hidden="true">
    <circle cx="26" cy="25" r="15" stroke="currentColor" strokeWidth="2" />
    <circle cx="26" cy="25" r="5" fill="currentColor" />
    <path d="M48 3v16M40 11h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}
