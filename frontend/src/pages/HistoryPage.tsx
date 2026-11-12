import { useState } from "react";
import { Link } from "react-router-dom";
import { analysisApi } from "../api";
import { errorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { useToast } from "../context/ToastContext";
import { Button, Card, EmptyState, ErrorBox, PageHeader, PageLoader, Spinner, formatDate, scoreColor } from "../components/ui/ui";
import type { Analysis } from "../types";

function Column({ a, other }: { a: Analysis; other: Analysis }) {
  const diff = a.match_score - other.match_score;
  const only = (mine: string[], theirs: string[]) => mine.filter((s) => !theirs.map((t) => t.toLowerCase()).includes(s.toLowerCase()));
  return (
    <Card>
      <p className="font-medium text-slate-800">{a.job_title} · {a.company}</p>
      <p className="text-xs text-slate-500">{a.resume_title} · {formatDate(a.created_at)}</p>
      <p className={`mt-3 text-4xl font-bold ${scoreColor(a.match_score)}`}>{a.match_score}
        {diff !== 0 && <span className="ml-2 text-sm font-medium text-slate-500">({diff > 0 ? "+" : ""}{diff} vs other)</span>}
      </p>
      <h3 className="mt-4 text-sm font-medium text-slate-700">Matching skills only here</h3>
      <p className="text-sm text-slate-600">{only(a.result.matching_skills, other.result.matching_skills).join(", ") || "None"}</p>
      <h3 className="mt-3 text-sm font-medium text-slate-700">Missing skills only here</h3>
      <p className="text-sm text-slate-600">{only(a.result.missing_skills, other.result.missing_skills).join(", ") || "None"}</p>
    </Card>
  );
}

export function HistoryPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(analysisApi.history);
  const [selected, setSelected] = useState<number[]>([]);
  const [compare, setCompare] = useState<[Analysis, Analysis] | null>(null);
  const [comparing, setComparing] = useState(false);

  const toggle = (id: number) => {
    setCompare(null);
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? [s[1], id] : [...s, id]));
  };

  const doCompare = async () => {
    setComparing(true);
    try { const [a, b] = await Promise.all(selected.map((id) => analysisApi.get(id))); setCompare([a, b]); }
    catch (e) { toast.error(errorMessage(e)); } finally { setComparing(false); }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this report?")) return;
    try { await analysisApi.remove(id); toast.success("Report deleted."); setSelected((s) => s.filter((x) => x !== id)); setCompare(null); void reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Analysis History" subtitle="Select any two reports to compare them."
                  action={<Button variant="secondary" disabled={selected.length !== 2} loading={comparing} onClick={doCompare}>Compare selected ({selected.length}/2)</Button>} />
      {loading ? <PageLoader /> : error ? <ErrorBox message={error} onRetry={reload} /> :
        !data || data.length === 0 ? <EmptyState title="No analyses yet" hint="Run an analysis from the Job Descriptions page." /> : (
          <ul className="space-y-3">
            {data.map((a) => (
              <li key={a.id}>
                <Card className="flex flex-wrap items-center gap-3">
                  <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)}
                         aria-label={`Select ${a.job_title} at ${a.company} for comparison`} className="h-4 w-4" />
                  <Link to={`/analysis/${a.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800">{a.job_title} · {a.company}</span>
                    <span className="block truncate text-xs text-slate-500">{a.resume_title} · {formatDate(a.created_at)}</span>
                  </Link>
                  <span className={`text-xl font-semibold ${scoreColor(a.match_score)}`}>{a.match_score}</span>
                  <Button variant="ghost" onClick={() => remove(a.id)} aria-label={`Delete report for ${a.job_title}`}>Delete</Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      {comparing && <div className="mt-4"><Spinner /></div>}
      {compare && (
        <div className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Comparison">
          <Column a={compare[0]} other={compare[1]} />
          <Column a={compare[1]} other={compare[0]} />
        </div>
      )}
    </>
  );
}
