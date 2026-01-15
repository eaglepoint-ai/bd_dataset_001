import { loadAuthor, loadBlogPosts } from './markdown-loader';
import { extractMetadata, parseBlogMetadata } from './metadata-extractor';
import { parseMarkdown } from './markdown-parser';
import { renderAuthor, renderBlogList, renderBlogPost } from './renderer';
import { router } from './router';
import { Author, BlogPost } from './types';

let authorData: Author | null = null;
let blogPosts: BlogPost[] = [];

async function parseAuthor(markdown: string): Promise<Author> {
  const parsed = extractMetadata(markdown);
  const content = parsed.content || markdown;
  
  const lines = content.split('\n').filter(line => line.trim());
  const name = lines.find(line => line.startsWith('# '))?.replace('# ', '') || 'Unknown';
  
  let bio = '';
  let links: Record<string, string> = {};
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
      if (match) {
        links[match[1]] = match[2];
      }
    }
  }
  
  return {
    name: name.trim(),
    bio: bio.trim(),
    links: links
  };
}

async function parseBlogPost(markdown: string, filename: string): Promise<BlogPost> {
  const parsed = extractMetadata(markdown);
  
  if (!parsed.metadata) {
    throw new Error(`Blog post ${filename} is missing metadata`);
  }
  
  const metadata = parseBlogMetadata(parsed, filename);
  
  return {
    metadata: metadata,
    content: parsed.content,
    filename: filename
  };
}

async function initializeApp(): Promise<void> {
  try {
    document.documentElement.setAttribute('data-blog-spa', 'loading');
    const authorMarkdown = await loadAuthor();
    authorData = await parseAuthor(authorMarkdown);
    
    const postData = await loadBlogPosts();
    blogPosts = await Promise.all(
      postData.map(async ({ content, filename }) => {
        return parseBlogPost(content, filename);
      })
    );
    
    setupRoutes();
    router.init();
    document.documentElement.setAttribute('data-blog-spa', 'ready');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = '<p>Error loading content. Please refresh the page.</p>';
    }
    document.documentElement.setAttribute('data-blog-spa', 'error');
  }
}

function setupRoutes(): void {
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
  
  router.register('post', (params?: Record<string, string>) => {
    const container = document.getElementById('app');
    if (!container || !params || !params.id) {
      router.navigate('home');
      return;
    }
    
    const postId = params.id.replace('.md', '');
    const post = blogPosts.find(p => p.filename === postId || p.filename.startsWith(postId));
    
    if (!post) {
      router.navigate('home');
      return;
    }
    
    container.innerHTML = '';
    renderBlogPost(post, container);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
