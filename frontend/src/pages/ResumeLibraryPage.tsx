import { useState } from "react";
import { Link } from "react-router-dom";
import { resumeApi } from "../api";
import { errorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { useToast } from "../context/ToastContext";
import { Button, Card, EmptyState, ErrorBox, PageHeader, PageLoader, Spinner, formatDate } from "../components/ui/ui";
import type { ResumeDetail } from "../types";

export function ResumeLibraryPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(resumeApi.list);
  const [detail, setDetail] = useState<ResumeDetail | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const view = async (id: number) => {
    setLoadingId(id);
    try { setDetail(await resumeApi.get(id)); } catch (e) { toast.error(errorMessage(e)); } finally { setLoadingId(null); }
  };

  const remove = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? Its analyses will also be deleted.`)) return;
    try { await resumeApi.remove(id); toast.success("Resume deleted."); if (detail?.id === id) setDetail(null); void reload(); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Resume Library" action={<Link to="/resumes/upload"><Button>Upload resume</Button></Link>} />
      {loading ? <PageLoader /> : error ? <ErrorBox message={error} onRetry={reload} /> :
        !data || data.length === 0 ? (
          <EmptyState title="No resumes yet" hint="Upload a PDF or DOCX to get started."
                      action={<Link to="/resumes/upload"><Button>Upload resume</Button></Link>} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ul className="space-y-3">
              {data.map((r) => (
                <li key={r.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{r.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {r.original_name} · {r.file_type.toUpperCase()} · {(r.file_size / 1024).toFixed(0)} KB · {formatDate(r.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => view(r.id)}>{loadingId === r.id ? <Spinner /> : "View"}</Button>
                      <Button variant="ghost" onClick={() => remove(r.id, r.title)} aria-label={`Delete ${r.title}`}>Delete</Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
            {detail && (
              <Card className="h-fit">
                <h2 className="font-semibold text-slate-800">{detail.title}</h2>
                <p className="text-xs text-slate-500">{detail.info.email ?? "No email found"} · {detail.info.word_count} words</p>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{detail.extracted_text}</pre>
              </Card>
            )}
          </div>
        )}
    </>
  );
}
