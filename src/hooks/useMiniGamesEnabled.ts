import { useEffect, useState } from 'react';

// Shared eligibility rule for optional mouse-driven mini-games.
const DESKTOP_INPUT = '(min-width: 861px) and (hover: hover) and (pointer: fine)';

export function useMiniGamesEnabled() {
  const [enabled, setEnabled] = useState(() => window.matchMedia(DESKTOP_INPUT).matches);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_INPUT);
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return enabled;
}
