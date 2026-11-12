import { useState } from "react";
import { useForm } from "react-hook-form";
import { applicationApi } from "../api";
import { errorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { useToast } from "../context/ToastContext";
import { Button, Card, EmptyState, ErrorBox, Field, PageHeader, PageLoader, formatDate, inputClass } from "../components/ui/ui";
import { STATUSES, type Application, type ApplicationStatus } from "../types";

const badge: Record<ApplicationStatus, string> = {
  applied: "bg-slate-100 text-slate-700", shortlisted: "bg-blue-100 text-blue-700", interview: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-700", offered: "bg-emerald-100 text-emerald-700",
};
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

interface FormValues { company: string; position: string; status: ApplicationStatus; applied_on: string; interview_date: string; note: string }

function ApplicationCard({ app, onChanged }: { app: Application; onChanged: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); onChanged(); } catch (e) { toast.error(errorMessage(e)); }
  };
  const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-800">{app.position}</p>
          <p className="text-sm text-slate-500">{app.company} · Applied {formatDate(app.applied_on ?? app.created_at)}</p>
          {app.interview_date && <p className="mt-1 text-xs text-amber-700">Interview: {new Date(app.interview_date).toLocaleString()}</p>}
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`status-${app.id}`}>Status for {app.position}</label>
          <select id={`status-${app.id}`} value={app.status} className={`rounded-full px-3 py-1 text-xs font-medium ${badge[app.status]}`}
                  onChange={(e) => run(() => applicationApi.update(app.id, { status: e.target.value as ApplicationStatus }), "Status updated.")}>
            {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
          </select>
          <Button variant="ghost" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? "Hide" : "Details"} ({app.notes.length})</Button>
          <Button variant="ghost" aria-label={`Delete ${app.position}`}
                  onClick={() => window.confirm("Delete this application?") && run(() => applicationApi.remove(app.id), "Application deleted.")}>Delete</Button>
        </div>
      </div>
      {open && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <Field label="Interview date & time" htmlFor={`int-${app.id}`}>
            <input id={`int-${app.id}`} type="datetime-local" className={inputClass} defaultValue={toLocalInput(app.interview_date)}
                   onBlur={(e) => e.target.value !== toLocalInput(app.interview_date) &&
                     run(() => applicationApi.update(app.id, { interview_date: e.target.value ? new Date(e.target.value).toISOString() : null }), "Interview date saved.")} />
          </Field>
          <ul className="space-y-2">
            {app.notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {n.content}<span className="mt-1 block text-xs text-slate-400">{formatDate(n.created_at)}</span>
              </li>
            ))}
          </ul>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) void run(() => applicationApi.addNote(app.id, note.trim()), "Note added.").then(() => setNote("")); }}>
            <label className="sr-only" htmlFor={`note-${app.id}`}>New note</label>
            <input id={`note-${app.id}`} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." />
            <Button type="submit" variant="secondary" disabled={!note.trim()}>Add</Button>
          </form>
        </div>
      )}
    </Card>
  );
}

export function ApplicationsPage() {
  const toast = useToast();
  const [filter, setFilter] = useState<ApplicationStatus | "">("");
  const { data, loading, error, reload } = useAsync(() => applicationApi.list(filter || undefined), [filter]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ defaultValues: { status: "applied" } });

  const changeFilter = (f: ApplicationStatus | "") => setFilter(f);

  const create = async (v: FormValues) => {
    try {
      await applicationApi.create({
        company: v.company, position: v.position, status: v.status,
        applied_on: v.applied_on || null,
        interview_date: v.interview_date ? new Date(v.interview_date).toISOString() : null,
        note: v.note || null,
      });
      toast.success("Application added."); reset({ status: "applied" }); setShowForm(false); void reload();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Application Tracker" subtitle="Keep track of where each application stands."
                  action={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "Add application"}</Button>} />
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit(create)} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Company" htmlFor="n-company" error={errors.company?.message}>
              <input id="n-company" className={inputClass} {...register("company", { required: "Company is required" })} />
            </Field>
            <Field label="Position" htmlFor="n-position" error={errors.position?.message}>
              <input id="n-position" className={inputClass} {...register("position", { required: "Position is required" })} />
            </Field>
            <Field label="Status" htmlFor="n-status">
              <select id="n-status" className={inputClass} {...register("status")}>{STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select>
            </Field>
            <Field label="Applied on" htmlFor="n-applied"><input id="n-applied" type="date" className={inputClass} {...register("applied_on")} /></Field>
            <Field label="Interview date (optional)" htmlFor="n-interview"><input id="n-interview" type="datetime-local" className={inputClass} {...register("interview_date")} /></Field>
            <Field label="Note (optional)" htmlFor="n-note"><input id="n-note" className={inputClass} {...register("note")} /></Field>
            <div className="sm:col-span-2"><Button type="submit" loading={isSubmitting}>Save application</Button></div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {(["", ...STATUSES] as const).map((s) => (
          <button key={s || "all"} onClick={() => changeFilter(s)} aria-pressed={filter === s}
                  className={`rounded-full px-3 py-1 text-sm ${filter === s ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50"}`}>
            {s ? cap(s) : "All"}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : error ? <ErrorBox message={error} onRetry={reload} /> :
        !data || data.length === 0 ? <EmptyState title="No applications here" hint={filter ? "Try a different filter." : "Add your first application."} /> : (
          <ul className="space-y-3">{data.map((a) => <li key={a.id}><ApplicationCard app={a} onChanged={reload} /></li>)}</ul>
        )}
    </>
  );
}
