import type { Snippet } from "../types/snippet";

type Props = {
  snippet: Snippet;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function truncate(text: string, maxChars: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return trimmed.slice(0, maxChars).trimEnd() + "…";
}

export default function SnippetCard({ snippet }: Props) {
  const isTemp = snippet.id.startsWith("temp-");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {snippet.title}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {isTemp ? "Saving…" : formatDate(snippet.created_at)}
          </p>
        </div>

        {isTemp && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
            pending
          </span>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
        {truncate(snippet.content, 160)}
      </p>
    </div>
  );
}
