import { useEffect, useState } from 'react';

export function useHighScore(score: number, game: 'ball' | 'selected-work') {
  const key = `portfolio.${game}.highScore`;
  const [saved, setSaved] = useState(() => {
    try {
      const value = Number(window.localStorage.getItem(key));
      return Number.isSafeInteger(value) && value >= 0 ? value : 0;
    } catch { return 0; }
  });
  const highScore = Math.max(saved, score);

  useEffect(() => {
    if (score <= saved) return;
    setSaved(score);
    try {
      window.localStorage.setItem(key, String(score));
    } catch { /* Keep the record for this visit if browser storage is blocked. */ }
  }, [key, saved, score]);

  return highScore;
}
