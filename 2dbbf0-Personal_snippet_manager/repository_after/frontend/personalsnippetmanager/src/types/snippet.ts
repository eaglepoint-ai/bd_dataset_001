export type Snippet = {
  id: string;          // UUID
  title: string;
  content: string;
  created_at: string;  // ISO datetime string
};

export type SnippetCreate = {
  title: string;
  content: string;
};
