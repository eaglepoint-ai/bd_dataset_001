import type { Snippet } from "../types/snippet";
import SnippetCard from "./SnippetCard";

type Props = {
  snippets: Snippet[];
  isLoading: boolean;
};

export default function SnippetList({ snippets, isLoading }: Props) {
  if (isLoading) return null;

  if (snippets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
        No snippets found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {snippets.map((s) => (
        <SnippetCard key={s.id} snippet={s} />
      ))}
    </div>
  );
}
