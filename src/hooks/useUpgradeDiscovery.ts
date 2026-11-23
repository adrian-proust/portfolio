import { createContext, useContext } from 'react';
export const UPGRADE_DISCOVERY_KEY = 'portfolio.upgrades.discovered';
export const UpgradeDiscoveryContext = createContext(false);
export const useUpgradeDiscovery = () => useContext(UpgradeDiscoveryContext);
