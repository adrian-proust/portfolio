import { createContext, useContext } from 'react';
export const UPGRADE_DISCOVERY_KEY = 'portfolio.upgrades.discovered';
export const SELECTED_DISCOVERY_KEY = 'portfolio.selected-work.upgrades.discovered';
export type MiniGame = 'ball' | 'selected-work';
export const UpgradeDiscoveryContext = createContext<{ ball: boolean; 'selected-work': boolean; announced: MiniGame | null }>({ ball: false, 'selected-work': false, announced: null });
export const useUpgradeDiscovery = (game: MiniGame = 'ball') => useContext(UpgradeDiscoveryContext)[game];
export const useUpgradeAnnouncement = () => useContext(UpgradeDiscoveryContext).announced;
