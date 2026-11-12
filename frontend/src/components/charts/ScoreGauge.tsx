import { scoreColor } from "../ui/ui";

/** Circular progress ring drawn with SVG. */
export function ScoreGauge({ score, size = 140 }: { score: number; size?: number }) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}
         role="img" aria-label={`Match score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke}
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                className={scoreColor(score)} />
      </svg>
      <div className="absolute text-center">
        <div className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</div>
        <div className="text-xs text-slate-500">/ 100</div>
      </div>
    </div>
  );
}
