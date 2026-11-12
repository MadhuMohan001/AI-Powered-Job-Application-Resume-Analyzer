import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardApi } from "../api";
import { useAsync } from "../hooks/useAsync";
import { Card, EmptyState, ErrorBox, PageHeader, PageLoader, formatDate, scoreColor } from "../components/ui/ui";
import { STATUSES } from "../types";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}

export function DashboardPage() {
  const { data, loading, error, reload } = useAsync(dashboardApi.summary);
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorBox message={error ?? "Could not load dashboard"} onRetry={reload} />;

  const chartData = STATUSES.map((s) => ({ status: s[0].toUpperCase() + s.slice(1), count: data.applications_by_status[s] ?? 0 }));
  const totalApps = chartData.reduce((a, b) => a + b.count, 0);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your resume and job search at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Resumes uploaded" value={data.total_resumes} />
        <Stat label="Jobs analyzed" value={data.total_analyses} hint={`${data.total_jobs} saved job descriptions`} />
        <Stat label="Average match score" value={data.average_match_score ?? "-"} hint="AI estimate, not a hiring prediction" />
        <Stat label="Applications tracked" value={totalApps} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-800">Applications by status</h2>
          {totalApps === 0 ? <p className="text-sm text-slate-500">No applications yet. <Link className="text-brand-600" to="/applications">Add one</Link>.</p> : (
            <div className="h-64" role="img" aria-label="Bar chart of applications by status">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-slate-800">Recent analyses</h2>
          {data.recent_analyses.length === 0 ? (
            <EmptyState title="No analyses yet" hint="Upload a resume, save a job, then run your first analysis."
                        action={<Link className="text-sm font-medium text-brand-600" to="/jobs">Go to jobs</Link>} />
          ) : (
            <ul className="divide-y">
              {data.recent_analyses.map((a) => (
                <li key={a.id}>
                  <Link to={`/analysis/${a.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">{a.job_title} · {a.company}</span>
                      <span className="block truncate text-xs text-slate-500">{a.resume_title} · {formatDate(a.created_at)}</span>
                    </span>
                    <span className={`text-lg font-semibold ${scoreColor(a.match_score)}`}>{a.match_score}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
