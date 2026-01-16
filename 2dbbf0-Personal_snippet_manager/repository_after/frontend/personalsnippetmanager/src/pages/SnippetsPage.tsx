import Loading from "../components/Loading";
import SearchInput from "../components/SearchInput";
import SnippetForm from "../components/SnippetForm";
import SnippetList from "../components/SnippetList";
import { useSnippets } from "../hooks/useSnippets";

export default function SnippetsPage() {
  const {
    filteredSnippets,
    search,
    setSearch,
    isLoading,
    error,
    addSnippetOptimistic,
  } = useSnippets();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Personal Snippet Manager
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Save commands, code snippets, notes
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <SnippetForm onCreate={addSnippetOptimistic} />
          <SearchInput value={search} onChange={setSearch} />

          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          {isLoading ? (
            <Loading />
          ) : (
            <SnippetList snippets={filteredSnippets} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}
