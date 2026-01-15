export function parseMarkdown(markdown: string): string {
  let html = markdown;
  
  html = parseHeaders(html);
  html = parseCodeBlocks(html);
  html = parseInlineCode(html);
  html = parseLinks(html);
  html = parseImages(html);
  html = parseBold(html);
  html = parseItalic(html);
  html = parseUnorderedLists(html);
  html = parseOrderedLists(html);
  html = parseParagraphs(html);
  
  return html;
}

function parseHeaders(html: string): string {
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  return html;
}

function parseCodeBlocks(html: string): string {
  return html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```[\w]*\n?/g, '').replace(/```/g, '');
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  });
}

function parseInlineCode(html: string): string {
  return html.replace(/`([^`]+)`/g, '<code>$1</code>');
}

function parseLinks(html: string): string {
  return html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function parseImages(html: string): string {
  return html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');
}

function parseBold(html: string): string {
  return html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function parseItalic(html: string): string {
  return html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function parseUnorderedLists(html: string): string {
  const lines = html.split('\n');
  let inList = false;
  let result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^[-*] (.+)$/);
    
    if (listMatch) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${listMatch[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('\n');
}

function parseOrderedLists(html: string): string {
  const lines = html.split('\n');
  let inList = false;
  let result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^\d+\. (.+)$/);
    
    if (listMatch) {
      if (!inList) {
        result.push('<ol>');
        inList = true;
      }
      result.push(`<li>${listMatch[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ol>');
        inList = false;
      }
      result.push(line);
    }
  }
  
  if (inList) {
    result.push('</ol>');
  }
  
  return result.join('\n');
}

function parseParagraphs(html: string): string {
  const lines = html.split('\n');
  const result: string[] = [];
  let currentParagraph: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      continue;
    }
    
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      if (currentParagraph.length > 0) {
        result.push(`<p>${currentParagraph.join(' ')}</p>`);
        currentParagraph = [];
      }
      result.push(trimmed);
    } else {
      currentParagraph.push(trimmed);
    }
  }
  
  if (currentParagraph.length > 0) {
    result.push(`<p>${currentParagraph.join(' ')}</p>`);
  }
  
  return result.join('\n');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
