import './GameScore.css';

const digitSegments = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
const segments = [
  ['a', '8,2 32,2 36,6 32,10 8,10 4,6'],
  ['b', '34,12 38,8 42,12 42,32 38,36 34,32'],
  ['c', '34,44 38,40 42,44 42,64 38,68 34,64'],
  ['d', '8,66 32,66 36,70 32,74 8,74 4,70'],
  ['e', '0,44 4,40 8,44 8,64 4,68 0,64'],
  ['f', '0,12 4,8 8,12 8,32 4,36 0,32'],
  ['g', '8,34 32,34 36,38 32,42 8,42 4,38'],
] as const;

export default function GameScore({ score }: { score: number }) {
  return (
    <output className="game-score" aria-label={`Game score: ${score}`} aria-live="polite" aria-atomic="true">
      <span className="game-score__label mono" aria-hidden="true">
        <span className="game-score__pickup" /> = Score
      </span>
      <span className="game-score__digits" key={score} aria-hidden="true">
        {String(score).padStart(3, '0').split('').map((digit, i) => (
          <svg viewBox="0 0 42 76" key={i} className="game-score__digit">
            {segments.map(([segment, points]) => (
              <polygon key={segment} points={points} opacity={digitSegments[Number(digit)].includes(segment) ? 1 : 0.07} />
            ))}
          </svg>
        ))}
      </span>
    </output>
  );
}
