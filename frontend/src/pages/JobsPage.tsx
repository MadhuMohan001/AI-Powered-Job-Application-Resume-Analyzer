import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { analysisApi, jobApi, resumeApi } from "../api";
import { errorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { useToast } from "../context/ToastContext";
import { Button, Card, EmptyState, ErrorBox, Field, PageHeader, PageLoader, formatDate, inputClass } from "../components/ui/ui";
import type { JobInput } from "../types";

export function JobsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const jobs = useAsync(jobApi.list);
  const resumes = useAsync(resumeApi.list);
  const [resumeId, setResumeId] = useState<number | "">("");
  const [analyzingJob, setAnalyzingJob] = useState<number | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<JobInput>();

  const save = async (d: JobInput) => {
    try { await jobApi.create(d); toast.success("Job saved."); reset(); void jobs.reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this job and its analyses?")) return;
    try { await jobApi.remove(id); toast.success("Job deleted."); void jobs.reload(); } catch (e) { toast.error(errorMessage(e)); }
  };

  const analyze = async (jobId: number) => {
    if (resumeId === "") return toast.error("Choose a resume to analyze first.");
    setAnalyzingJob(jobId);
    try { const a = await analysisApi.analyze(resumeId, jobId); navigate(`/analysis/${a.id}`); }
    catch (e) { toast.error(errorMessage(e)); setAnalyzingJob(null); }
  };

  return (
    <>
      <PageHeader title="Job Descriptions" subtitle="Save a job posting, then analyze your resume against it." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-800">Add a job</h2>
          <form onSubmit={handleSubmit(save)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Job title" htmlFor="title" error={errors.title?.message}>
                <input id="title" className={inputClass} {...register("title", { required: "Title is required", maxLength: 200 })} />
              </Field>
              <Field label="Company" htmlFor="company" error={errors.company?.message}>
                <input id="company" className={inputClass} {...register("company", { required: "Company is required", maxLength: 200 })} />
              </Field>
            </div>
            <Field label="Job description" htmlFor="description" error={errors.description?.message}>
              <textarea id="description" rows={10} className={inputClass} placeholder="Paste the full job description here..."
                        {...register("description", { required: "Description is required", minLength: { value: 30, message: "Paste at least 30 characters" }, maxLength: { value: 20000, message: "Max 20,000 characters" } })} />
            </Field>
            <Button type="submit" loading={isSubmitting}>Save job</Button>
          </form>
        </Card>

        <div>
          <h2 className="mb-3 font-semibold text-slate-800">Saved jobs</h2>
          {resumes.data && resumes.data.length > 0 ? (
            <div className="mb-4">
              <Field label="Analyze using resume" htmlFor="resume">
                <select id="resume" className={inputClass} value={resumeId} onChange={(e) => setResumeId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">Select a resume...</option>
                  {resumes.data.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
              </Field>
            </div>
          ) : !resumes.loading && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Upload a resume first to run an analysis.</p>}

          {jobs.loading ? <PageLoader /> : jobs.error ? <ErrorBox message={jobs.error} onRetry={jobs.reload} /> :
            !jobs.data || jobs.data.length === 0 ? <EmptyState title="No saved jobs" hint="Add your first job on the left." /> : (
              <ul className="space-y-3">
                {jobs.data.map((j) => (
                  <li key={j.id}>
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">{j.title}</p>
                          <p className="text-sm text-slate-500">{j.company} · {formatDate(j.created_at)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button loading={analyzingJob === j.id} disabled={analyzingJob !== null} onClick={() => analyze(j.id)}>Analyze</Button>
                          <Button variant="ghost" onClick={() => remove(j.id)} aria-label={`Delete ${j.title}`}>Delete</Button>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">{j.description}</p>
                      {analyzingJob === j.id && <p className="mt-2 text-xs text-slate-500">Analyzing with AI. This can take 10-30 seconds...</p>}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </>
  );
}
