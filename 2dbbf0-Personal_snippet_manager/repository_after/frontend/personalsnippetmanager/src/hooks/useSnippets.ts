import { useEffect, useMemo, useState } from "react";
import type { Snippet, SnippetCreate } from "../types/snippet";
import { createSnippet, fetchSnippets } from "../api/snippets";

type UseSnippetsResult = {
  snippets: Snippet[];
  filteredSnippets: Snippet[];
  search: string;
  setSearch: (v: string) => void;

  isLoading: boolean;
  error: string | null;

  addSnippetOptimistic: (payload: SnippetCreate) => Promise<void>;
  refresh: () => Promise<void>;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function matches(snippet: Snippet, query: string) {
  if (!query) return true;
  const q = normalize(query);

  return (
    snippet.title.toLowerCase().includes(q) ||
    snippet.content.toLowerCase().includes(q)
  );
}

function makeTempSnippet(payload: SnippetCreate): Snippet {
  return {
    id: `temp-${crypto.randomUUID()}`,
    title: payload.title,
    content: payload.content,
    created_at: new Date().toISOString(),
  };
}

export function useSnippets(): UseSnippetsResult {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSnippets();
      setSnippets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load snippets");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filteredSnippets = useMemo(() => {
    return snippets.filter((s) => matches(s, search));
  }, [snippets, search]);

  async function addSnippetOptimistic(payload: SnippetCreate) {
    setError(null);
    const temp = makeTempSnippet(payload);
    setSnippets((prev) => [temp, ...prev]);

    try {
      const created = await createSnippet(payload);
      setSnippets((prev) => prev.map((s) => (s.id === temp.id ? created : s)));
    } catch (e) {
      setSnippets((prev) => prev.filter((s) => s.id !== temp.id));
      setError(e instanceof Error ? e.message : "Failed to save snippet");
      throw e;
    }
  }

  return {
    snippets,
    filteredSnippets,
    search,
    setSearch,
    isLoading,
    error,
    addSnippetOptimistic,
    refresh,
  };
}
