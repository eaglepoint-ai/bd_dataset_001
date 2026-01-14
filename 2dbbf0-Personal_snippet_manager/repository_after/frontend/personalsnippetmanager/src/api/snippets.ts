import type { Snippet, SnippetCreate } from "../types/snippet";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") message = data.detail;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export async function fetchSnippets(): Promise<Snippet[]> {
  return request<Snippet[]>("/snippets", { method: "GET" });
}

export async function createSnippet(payload: SnippetCreate): Promise<Snippet> {
  return request<Snippet>("/snippets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
