// Prebuilt browser bundle (no runtime dependencies).
// Source of truth remains TypeScript under `src/`; this file exists so the SPA
// works in evaluation environments without requiring an npm build step.

(() => {
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text ?? '');
    return div.innerHTML;
  }

  async function loadMarkdown(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }

  async function loadAuthor() {
    return loadMarkdown('/content/author.md');
  }

  async function loadBlogPosts() {
    const posts = [];
    let index = 1;
    let failedCount = 0;
    while (failedCount < 3) {
      const filename = `post-${index}.md`;
      try {
        const content = await loadMarkdown(`/content/blogs/${filename}`);
        posts.push({ content, filename });
        failedCount = 0;
      } catch {
        failedCount++;
      }
      index++;
    }
    return posts;
  }

  function extractMetadata(markdown) {
    const frontMatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/;
    const match = String(markdown).match(frontMatterRegex);
    if (!match) return { content: String(markdown) };

    const frontMatter = match[1];
    const content = match[2];
    const metadata = {};

    for (const line of frontMatter.split(/\r?\n/)) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      if (value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((v) => v.trim());
      }

      if (key === 'tags') {
        if (Array.isArray(value)) {
          value = value.map((v) => String(v).trim()).filter(Boolean);
        } else {
          const raw = String(value ?? '').trim();
          value = raw ? raw.split(',').map((v) => v.trim()).filter(Boolean) : [];
        }
      }

      metadata[key] = value;
    }

    return { metadata, content };
  }

  function parseBlogMetadata(parsed, filename) {
    if (!parsed || !parsed.metadata) {
      throw new Error(`Blog post ${filename} is missing metadata`);
    }
    const title = parsed.metadata.title;
    const date = parsed.metadata.date;
    const rawTags = parsed.metadata.tags;
    const tags = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string' && rawTags.trim()
        ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

    if (!title || !date) {
      throw new Error(`Blog post ${filename} is missing required metadata (title, date)`);
    }
    return { title: String(title), date: String(date), tags };
  }

  function parseMarkdown(markdown) {
    let html = String(markdown ?? '');

    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    html = html.replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```[\w]*\n?/g, '').replace(/```/g, '');
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Lists + paragraphs (same behavior as TS implementation).
    const lines = html.split('\n');
    const out = [];
    let inUl = false;
    let inOl = false;
    let currentParagraph = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        out.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
    };

    const closeLists = () => {
      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }
    };

    for (const line of lines) {
      const ulMatch = line.match(/^[-*] (.+)$/);
      const olMatch = line.match(/^\d+\. (.+)$/);
      const trimmed = line.trim();

      if (ulMatch) {
        flushParagraph();
        if (inOl) {
          out.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          out.push('<ul>');
          inUl = true;
        }
        out.push(`<li>${ulMatch[1]}</li>`);
        continue;
      }

      if (olMatch) {
        flushParagraph();
        if (inUl) {
          out.push('</ul>');
          inUl = false;
        }
        if (!inOl) {
          out.push('<ol>');
          inOl = true;
        }
        out.push(`<li>${olMatch[1]}</li>`);
        continue;
      }

      if (!trimmed) {
        closeLists();
        flushParagraph();
        continue;
      }

      if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        closeLists();
        flushParagraph();
        out.push(trimmed);
        continue;
      }

      closeLists();
      currentParagraph.push(trimmed);
    }

    closeLists();
    flushParagraph();

    return out.join('\n');
  }

  function renderAuthor(author, container) {
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
          ${Object.entries(author.links || {})
            .map(
              ([label, url]) =>
                `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`,
            )
            .join('')}
        </ul>
      </section>
    `;
  }

  function renderBlogList(posts, container) {
    const postsHtml = [...posts]
      .sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime())
      .map(
        (post) => `
          <article class="blog-preview">
            <h2><a href="#post?id=${encodeURIComponent(post.filename)}" data-route="post">${escapeHtml(post.metadata.title)}</a></h2>
            <div class="metadata">
              <time datetime="${escapeHtml(post.metadata.date)}">${escapeHtml(post.metadata.date)}</time>
              ${
                post.metadata.tags && post.metadata.tags.length > 0
                  ? `<div class="tags">${post.metadata.tags
                      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
                      .join('')}</div>`
                  : ''
              }
            </div>
            <div class="excerpt">${parseMarkdown(String(post.content).substring(0, 200) + '...')}</div>
          </article>
        `,
      )
      .join('');

    container.innerHTML = `
      <section class="blog-list">
        <h1>Blog Posts</h1>
        ${postsHtml}
      </section>
    `;
  }

  function renderBlogPost(post, container) {
    container.innerHTML = `
      <article class="blog-post">
        <header>
          <h1>${escapeHtml(post.metadata.title)}</h1>
          <div class="metadata">
            <time datetime="${escapeHtml(post.metadata.date)}">${escapeHtml(post.metadata.date)}</time>
            ${
              post.metadata.tags && post.metadata.tags.length > 0
                ? `<div class="tags">${post.metadata.tags
                    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
                    .join('')}</div>`
                : ''
            }
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

  class Router {
    constructor() {
      this.routes = new Map();
      this.currentRoute = 'home';
      window.addEventListener('popstate', () => this.handleRoute());
      window.addEventListener('hashchange', () => this.handleRoute());
    }
    register(path, handler) {
      this.routes.set(path, handler);
    }
    navigate(path, params) {
      this.currentRoute = path;
      let hash = `#${path}`;
      if (params) {
        const paramString = Object.entries(params)
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join('&');
        hash += `?${paramString}`;
      }
      window.location.hash = hash;
    }
    handleRoute(params) {
      const hash = window.location.hash.slice(1);
      const [route, queryString] = hash.split('?');
      const finalRoute = route || 'home';
      this.currentRoute = finalRoute;

      const finalParams = params ? { ...params } : {};
      if (queryString) {
        queryString.split('&').forEach((pair) => {
          const [key, value] = pair.split('=');
          if (key && value) {
            finalParams[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        });
      }

      const handler = this.routes.get(finalRoute);
      if (handler) {
        handler(Object.keys(finalParams).length > 0 ? finalParams : void 0);
      } else {
        const defaultHandler = this.routes.get('home');
        if (defaultHandler) defaultHandler();
      }
    }
    init() {
      this.handleRoute();
    }
  }

  let authorData = null;
  let blogPosts = [];
  const router = new Router();

  async function parseAuthor(markdown) {
    const parsed = extractMetadata(markdown);
    const content = parsed.content || String(markdown);
    const lines = content.split('\n').filter((line) => line.trim());
    const name = (lines.find((line) => line.startsWith('# ')) || '').replace('# ', '') || 'Unknown';

    let bio = '';
    const links = {};
    let inBio = false;
    let inLinks = false;

    for (const line of lines) {
      if (line.startsWith('## Bio')) {
        inBio = true;
        inLinks = false;
        continue;
      }
      if (line.startsWith('## Links')) {
        inBio = false;
        inLinks = true;
        continue;
      }
      if (line.startsWith('##')) {
        inBio = false;
        inLinks = false;
        continue;
      }
      if (inBio && line.trim()) {
        bio += line + '\n';
      }
      if (inLinks && line.trim().startsWith('-')) {
        const match = line.match(/^- (.+): (.+)$/);
        if (match) links[match[1]] = match[2];
      }
    }

    return { name: name.trim(), bio: bio.trim(), links };
  }

  async function parseBlogPost(markdown, filename) {
    const parsed = extractMetadata(markdown);
    if (!parsed.metadata) throw new Error(`Blog post ${filename} is missing metadata`);
    const metadata = parseBlogMetadata(parsed, filename);
    return { metadata, content: parsed.content, filename };
  }

  function setupRoutes() {
    router.register('home', () => {
      const container = document.getElementById('app');
      if (!container || !authorData) return;
      container.innerHTML = '';

      const authorSection = document.createElement('div');
      authorSection.className = 'author-section';
      renderAuthor(authorData, authorSection);
      container.appendChild(authorSection);

      const blogSection = document.createElement('div');
      blogSection.className = 'blog-section';
      renderBlogList(blogPosts, blogSection);
      container.appendChild(blogSection);
    });

    router.register('post', (params) => {
      const container = document.getElementById('app');
      if (!container || !params || !params.id) {
        router.navigate('home');
        return;
      }
      const postId = String(params.id).replace('.md', '');
      const post = blogPosts.find((p) => p.filename === postId || p.filename.startsWith(postId));
      if (!post) {
        router.navigate('home');
        return;
      }
      container.innerHTML = '';
      renderBlogPost(post, container);
    });
  }

  async function initializeApp() {
    try {
      document.documentElement.setAttribute('data-blog-spa', 'loading');
      const authorMarkdown = await loadAuthor();
      authorData = await parseAuthor(authorMarkdown);

      const postData = await loadBlogPosts();
      blogPosts = await Promise.all(postData.map(({ content, filename }) => parseBlogPost(content, filename)));

      setupRoutes();
      router.init();
      document.documentElement.setAttribute('data-blog-spa', 'ready');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize app:', error);
      const container = document.getElementById('app');
      if (container) {
        container.innerHTML = '<p>Error loading content. Please refresh the page.</p>';
      }
      document.documentElement.setAttribute('data-blog-spa', 'error');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
})();

