export function Disclaimer({ text }: { text?: string }) {
  return (
    <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800" role="note">
      {text ?? "AI scores are estimates to help you improve your resume. They are not predictions of hiring decisions."}
    </p>
  );
}
