import { useState } from "react";
import type { SnippetCreate } from "../types/snippet";

type Props = {
  onCreate: (payload: SnippetCreate) => Promise<void>;
};

export default function SnippetForm({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    const payload: SnippetCreate = {
      title: title.trim(),
      content: content.trim(),
    };

    if (!payload.title) {
      setLocalError("Title is required.");
      return;
    }
    if (!payload.content) {
      setLocalError("Content is required.");
      return;
    }

    setIsSaving(true);
    try {
      await onCreate(payload);

      // Clear form AFTER successful save
      setTitle("");
      setContent("");
    } catch (e) {
      // onCreate already sets global error; keep a short local message too
      setLocalError(e instanceof Error ? e.message : "Failed to save snippet.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">New Snippet</h2>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="e.g., Docker cleanup commands"
          maxLength={200}
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-32 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          placeholder="Paste your snippet here..."
          maxLength={50_000}
        />
      </div>

      {localError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {localError}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        
      </div>
    </form>
  );
}
