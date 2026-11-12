interface Props { matching: string[]; missing: string[] }

/** Progress bar showing what share of the required skills the resume covers, plus skill chips. */
export function SkillBars({ matching, missing }: Props) {
  const total = matching.length + missing.length;
  const pct = total === 0 ? 0 : Math.round((matching.length / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-700">Skill coverage</span>
        <span className="text-slate-500">{matching.length} of {total} skills ({pct}%)</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar"
           aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Skill coverage">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Chips title="Matching skills" items={matching} className="bg-emerald-50 text-emerald-700" />
        <Chips title="Missing skills" items={missing} className="bg-red-50 text-red-700" />
      </div>
    </div>
  );
}

function Chips({ title, items, className }: { title: string; items: string[]; className: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-700">{title}</h3>
      {items.length === 0 ? <p className="text-sm text-slate-400">None</p> : (
        <ul className="flex flex-wrap gap-2">
          {items.map((s) => <li key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>{s}</li>)}
        </ul>
      )}
    </div>
  );
}
