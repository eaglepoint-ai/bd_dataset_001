import { Author, BlogPost } from './types';
import { parseMarkdown } from './markdown-parser';

export function renderAuthor(author: Author, container: HTMLElement): void {
  container.innerHTML = `
    <header>
      <h1>${escapeHtml(author.name)}</h1>
    </header>
    <section class="bio">
      <h2>About</h2>
      ${parseMarkdown(author.bio)}
    </section>
    <section class="links">
      <h2>Links</h2>
      <ul>
        ${Object.entries(author.links).map(([label, url]) => 
          `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`
        ).join('')}
      </ul>
    </section>
  `;
}

export function renderBlogList(posts: BlogPost[], container: HTMLElement): void {
  const postsHtml = posts
    .sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime())
    .map(post => `
      <article class="blog-preview">
        <h2><a href="#post?id=${encodeURIComponent(post.filename)}" data-route="post">${escapeHtml(post.metadata.title)}</a></h2>
        <div class="metadata">
          <time datetime="${escapeHtml(post.metadata.date)}">${escapeHtml(post.metadata.date)}</time>
          ${post.metadata.tags.length > 0 ? `<div class="tags">${post.metadata.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="excerpt">${parseMarkdown(post.content.substring(0, 200) + '...')}</div>
      </article>
    `).join('');
  
  container.innerHTML = `
    <section class="blog-list">
      <h1>Blog Posts</h1>
      ${postsHtml}
    </section>
  `;
}

export function renderBlogPost(post: BlogPost, container: HTMLElement): void {
  container.innerHTML = `
    <article class="blog-post">
      <header>
        <h1>${escapeHtml(post.metadata.title)}</h1>
        <div class="metadata">
          <time datetime="${escapeHtml(post.metadata.date)}">${escapeHtml(post.metadata.date)}</time>
          ${post.metadata.tags.length > 0 ? `<div class="tags">${post.metadata.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        </div>
      </header>
      <div class="content">
        ${parseMarkdown(post.content)}
      </div>
      <footer>
        <a href="#home" data-route="home">← Back to Home</a>
      </footer>
    </article>
  `;
}

import { router } from './router';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
