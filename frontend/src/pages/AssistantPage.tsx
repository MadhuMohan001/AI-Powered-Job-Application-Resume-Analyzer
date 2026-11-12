import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { assistantApi, jobApi, resumeApi } from "../api";
import { errorMessage } from "../api/client";
import { useAsync } from "../hooks/useAsync";
import { Button, Card, Field, PageHeader, PageLoader, inputClass } from "../components/ui/ui";
import type { ChatMessage } from "../types";

const SUGGESTIONS = [
  "Rewrite my project bullet points to be stronger without inventing anything.",
  "Which keywords from the job am I missing?",
  "Why are certain skills marked as missing?",
  "What should I learn first to improve my match?",
];

export function AssistantPage() {
  const [params] = useSearchParams();
  const resumes = useAsync(resumeApi.list);
  const jobs = useAsync(jobApi.list);
  const [resumeId, setResumeId] = useState<number | "">(params.get("resume") ? Number(params.get("resume")) : "");
  const [jobId, setJobId] = useState<number | "">(params.get("job") ? Number(params.get("job")) : "");
  const [messages, setMessages] = useState<(ChatMessage & { tools?: string[] })[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: "smooth" }); }, [messages, sending]);

  if (resumes.loading || jobs.loading) return <PageLoader />;

  const send = async (text: string) => {
    if (!text.trim() || resumeId === "") return;
    const history: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput(""); setError(null); setSending(true);
    try {
      const res = await assistantApi.chat({ resume_id: resumeId, job_id: jobId === "" ? undefined : jobId, message: text, history });
      setMessages((m) => [...m, { role: "assistant", content: res.reply, tools: res.tools_used }]);
    } catch (e) { setError(errorMessage(e)); } finally { setSending(false); }
  };

  return (
    <>
      <PageHeader title="AI Resume Assistant" subtitle="Ask about your resume. The assistant never invents experience for you." />
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Field label="Resume" htmlFor="a-resume">
          <select id="a-resume" className={inputClass} value={resumeId}
                  onChange={(e) => { setResumeId(e.target.value ? Number(e.target.value) : ""); setMessages([]); }}>
            <option value="">Select a resume...</option>
            {resumes.data?.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </Field>
        <Field label="Target job (optional)" htmlFor="a-job">
          <select id="a-job" className={inputClass} value={jobId} onChange={(e) => setJobId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">None</option>
            {jobs.data?.map((j) => <option key={j.id} value={j.id}>{j.title} · {j.company}</option>)}
          </select>
        </Field>
      </div>

      <Card className="flex h-[28rem] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.length === 0 && (
            <div>
              <p className="mb-3 text-sm text-slate-500">{resumeId === "" ? "Select a resume to begin." : "Try one of these:"}</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} disabled={resumeId === ""} onClick={() => send(s)}
                          className="rounded-full bg-brand-50 px-3 py-1 text-left text-xs text-brand-700 hover:bg-brand-100 disabled:opacity-50">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                {m.content}
                {m.tools && m.tools.length > 0 && <p className="mt-2 text-xs text-slate-500">Looked up: {m.tools.join(", ")}</p>}
              </div>
            </div>
          ))}
          {sending && <p className="text-sm text-slate-500">Thinking...</p>}
          <div ref={endRef} />
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
          <label htmlFor="chat-input" className="sr-only">Your question</label>
          <input id="chat-input" className={inputClass} value={input} maxLength={2000} disabled={resumeId === ""}
                 onChange={(e) => setInput(e.target.value)} placeholder="Ask about your resume..." />
          <Button type="submit" loading={sending} disabled={!input.trim() || resumeId === ""}>Send</Button>
        </form>
      </Card>
    </>
  );
}
