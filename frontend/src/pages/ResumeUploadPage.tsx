import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { resumeApi } from "../api";
import { errorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { Button, Card, Field, PageHeader, inputClass } from "../components/ui/ui";
import type { ResumeDetail } from "../types";

const MAX_MB = 5;
const ALLOWED = [".pdf", ".docx"];

export function validateFile(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED.includes(ext)) return "Only PDF and DOCX files are allowed.";
  if (file.size > MAX_MB * 1024 * 1024) return `File must be smaller than ${MAX_MB} MB.`;
  if (file.size === 0) return "The file is empty.";
  return null;
}

export function ResumeUploadPage() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ResumeDetail | null>(null);

  const onPick = (f: File | undefined) => {
    setResult(null);
    if (!f) return setFile(null);
    const problem = validateFile(f);
    setError(problem);
    setFile(problem ? null : f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError("Please choose a file first.");
    setUploading(true);
    setError(null);
    try {
      const resume = await resumeApi.upload(file, title.trim() || undefined);
      setResult(resume);
      setFile(null); setTitle("");
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Resume uploaded and text extracted.");
    } catch (err) {
      setError(errorMessage(err));
    } finally { setUploading(false); }
  };

  return (
    <>
      <PageHeader title="Upload Resume" subtitle="PDF or DOCX, up to 5 MB. Text-based files only (not scanned images)." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={submit} className="space-y-4">
            {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <Field label="Resume file" htmlFor="file">
              <input id="file" ref={inputRef} type="file" accept=".pdf,.docx"
                     onChange={(e) => onPick(e.target.files?.[0])}
                     className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700" />
            </Field>
            <Field label="Title (optional)" htmlFor="title">
              <input id="title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)}
                     placeholder="e.g. Frontend resume v2" className={inputClass} />
            </Field>
            <Button type="submit" loading={uploading} disabled={!file}>Upload & extract</Button>
          </form>
        </Card>

        {result && (
          <Card>
            <h2 className="font-semibold text-slate-800">Extracted information</h2>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <dt className="text-slate-500">Email</dt><dd className="col-span-2">{result.info.email ?? "Not found"}</dd>
              <dt className="text-slate-500">Phone</dt><dd className="col-span-2">{result.info.phone ?? "Not found"}</dd>
              <dt className="text-slate-500">Words</dt><dd className="col-span-2">{result.info.word_count}</dd>
            </dl>
            <h3 className="mt-4 text-sm font-medium text-slate-700">Text preview</h3>
            <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{result.extracted_text.slice(0, 1500)}</pre>
            <div className="mt-4 flex gap-3">
              <Link to="/jobs" className="text-sm font-medium text-brand-600">Next: add a job &rarr;</Link>
              <Link to="/resumes" className="text-sm text-slate-500">Resume library</Link>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
