import { digitalLetters, letterBars } from './digitalLetters';

export const SEGMENT_REVEAL_MS = 360;

/** Sweep from the right with a small, stable variation between neighbouring bars. */
export function segmentRevealDelay(slot: number, segment: number, round: number, slots: number) {
  return (slots - slot - 1) * 60 + ((slot * 17 + segment * 29 + round * 11) % 7) * 12;
}

export function phraseRevealDuration(phrase: string, slots: number, round: number) {
  const cells = Array.from(phrase.padStart(slots, ' '));
  const ends = cells.flatMap((character, slot) => Object.keys(letterBars).flatMap((segment, index) =>
    digitalLetters[character]?.includes(segment)
      ? [segmentRevealDelay(slot, index, round, slots) + SEGMENT_REVEAL_MS] : []));
  return Math.max(0, ...ends);
}
