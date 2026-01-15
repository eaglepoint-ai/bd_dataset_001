export interface Author {
  name: string;
  bio: string;
  links: Record<string, string>;
}

export interface BlogMetadata {
  title: string;
  date: string;
  tags: string[];
}

export interface BlogPost {
  metadata: BlogMetadata;
  content: string;
  filename: string;
}

export interface ParsedMarkdown {
  metadata?: Record<string, string | string[]>;
  content: string;
}
