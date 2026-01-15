export async function loadMarkdown(path: string): Promise<string> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    throw new Error(`Error loading markdown from ${path}: ${error}`);
  }
}

export async function loadAuthor(): Promise<string> {
  return loadMarkdown('/content/author.md');
}

export async function loadBlogPosts(): Promise<Array<{ content: string; filename: string }>> {
  const posts: Array<{ content: string; filename: string }> = [];
  let index = 1;
  let failedCount = 0;
  
  while (failedCount < 3) {
    const filename = `post-${index}.md`;
    try {
      const content = await loadMarkdown(`/content/blogs/${filename}`);
      posts.push({ content, filename });
      failedCount = 0;
      index++;
    } catch (error) {
      failedCount++;
      if (failedCount >= 3) {
        break;
      }
      index++;
    }
  }
  
  return posts;
}
