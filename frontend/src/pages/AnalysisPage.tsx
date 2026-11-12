import { Link, useNavigate, useParams } from "react-router-dom";
import { analysisApi } from "../api";
import { errorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { useToast } from "../context/ToastContext";
import { ScoreGauge } from "../components/charts/ScoreGauge";
import { SkillBars } from "../components/charts/SkillBars";
import { Disclaimer } from "../components/ui/Disclaimer";
import { Button, Card, ErrorBox, PageHeader, PageLoader, formatDate } from "../components/ui/ui";

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <h2 className="mb-2 font-semibold text-slate-800">{title}</h2>
      {items.length === 0 ? <p className="text-sm text-slate-400">Nothing to show.</p> : (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>
      )}
    </Card>
  );
}

export function AnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => analysisApi.get(Number(id)));

  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? "Analysis not found"} onRetry={reload} />;
  const r = data.result;

  const remove = async () => {
    if (!window.confirm("Delete this report?")) return;
    try { await analysisApi.remove(data.id); toast.success("Report deleted."); navigate("/history"); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title={`${data.job_title} · ${data.company}`}
        subtitle={`Resume: ${data.resume_title} · ${formatDate(data.created_at)} · ${data.model_name} (prompt ${data.prompt_version})`}
        action={<div className="flex gap-2">
          <Link to={`/assistant?resume=${data.resume_id}&job=${data.job_id}`}><Button variant="secondary">Ask AI assistant</Button></Link>
          <Button variant="ghost" onClick={remove}>Delete</Button></div>} />
      <div className="space-y-6">
        <Disclaimer text={data.disclaimer} />
        <Card className="flex flex-col items-center gap-6 sm:flex-row">
          <ScoreGauge score={data.match_score} />
          <div>
            <h2 className="font-semibold text-slate-800">Summary</h2>
            <p className="mt-1 text-sm text-slate-700">{r.summary}</p>
          </div>
        </Card>
        <Card><SkillBars matching={r.matching_skills} missing={r.missing_skills} /></Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <List title="Relevant experience" items={r.relevant_experience} />
          <List title="Improvement suggestions" items={r.suggestions} />
          <Card>
            <h2 className="mb-2 font-semibold text-slate-800">Education</h2>
            <p className="text-sm text-slate-700">{r.education_analysis}</p>
          </Card>
          <Card>
            <h2 className="mb-2 font-semibold text-slate-800">Important keywords</h2>
            <ul className="flex flex-wrap gap-2">
              {r.keywords.map((k) => <li key={k} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{k}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
