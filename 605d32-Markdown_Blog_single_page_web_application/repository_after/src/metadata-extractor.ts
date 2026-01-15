import { ParsedMarkdown, BlogMetadata } from './types';

export function extractMetadata(markdown: string): ParsedMarkdown {
  // Support both LF and CRLF line endings.
  // Frontmatter format:
  // ---
  // key: value
  // ---
  // content...
  const frontMatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/;
  const match = markdown.match(frontMatterRegex);
  
  if (!match) {
    return { content: markdown };
  }
  
  const frontMatter = match[1];
  const content = match[2];
  const metadata: Record<string, string | string[]> = {};
  
  const lines = frontMatter.split(/\r?\n/);
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    let value: string | string[] = line.substring(colonIndex + 1).trim();
    
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim());
    }

    // Normalize "tags" to a string array (supports "a, b, c" and "[a, b, c]").
    if (key === 'tags') {
      if (Array.isArray(value)) {
        value = value.map(v => v.trim()).filter(Boolean);
      } else if (typeof value === 'string') {
        const raw = value.trim();
        value = raw
          ? raw.split(',').map(v => v.trim()).filter(Boolean)
          : [];
      }
    }
    
    metadata[key] = value;
  }
  
  return { metadata, content };
}

export function parseBlogMetadata(parsed: ParsedMarkdown, filename: string): BlogMetadata {
  if (!parsed.metadata) {
    throw new Error(`Blog post ${filename} is missing metadata`);
  }
  
  const title = parsed.metadata.title as string;
  const date = parsed.metadata.date as string;
  const rawTags = parsed.metadata.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string' && rawTags.trim()
      ? rawTags.split(',').map(t => t.trim()).filter(Boolean)
      : [];
  
  if (!title || !date) {
    throw new Error(`Blog post ${filename} is missing required metadata (title, date)`);
  }
  
  return {
    title: title,
    date: date,
    tags: tags || []
  };
}
