import { useState } from 'react';

function UrlList({ urls, loading, onDelete, onCopy }) {
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleCopy = (url) => {
    onCopy(url.shortUrl);
    setCopiedId(url.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this URL?')) {
      return;
    }
    
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="loading">⏳ Loading URLs...</div>
      </div>
    );
  }

  if (!urls || urls.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <p>📭 No URLs yet. Create your first short URL above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <h2>📊 Your URLs ({urls.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Short URL</th>
            <th>Original URL</th>
            <th>Clicks</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {urls.map((url) => (
            <tr key={url.id}>
              <td className="url-cell">
                <a 
                  href={url.shortUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {url.shortCode}
                </a>
              </td>
              <td className="url-cell original-url" title={url.originalUrl}>
                {url.originalUrl}
              </td>
              <td>
                <span className="clicks-badge">{url.clicks}</span>
              </td>
              <td>{formatDate(url.createdAt)}</td>
              <td>
                <div className="actions">
                  <button
                    className="btn btn-copy"
                    onClick={() => handleCopy(url)}
                    disabled={copiedId === url.id}
                  >
                    {copiedId === url.id ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    className="btn btn-delete"
                    onClick={() => handleDelete(url.id)}
                    disabled={deletingId === url.id}
                  >
                    {deletingId === url.id ? '...' : '🗑️ Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UrlList;

