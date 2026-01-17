import { useState } from 'react';
import useUrls from './hooks/useUrls';
import UrlForm from './components/UrlForm';
import UrlList from './components/UrlList';

function App() {
  const { 
    urls, 
    loading, 
    error, 
    success, 
    createUrl, 
    deleteUrl, 
    clearError, 
    clearSuccess 
  } = useUrls();

  const [copied, setCopied] = useState(false);

  const handleCopySuccess = (shortUrl) => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app">
      <h1>🔗 URL Shortener</h1>
      
      <UrlForm 
        onSubmit={createUrl} 
        error={error}
        onClearError={clearError}
      />
      
      {success && (
        <div className="success-message">
          <span>
            ✅ Short URL created: {' '}
            <a href={success.shortUrl} target="_blank" rel="noopener noreferrer">
              {success.shortUrl}
            </a>
          </span>
          <button 
            className="btn btn-copy" 
            onClick={() => handleCopySuccess(success.shortUrl)}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      )}
      
      <UrlList 
        urls={urls} 
        loading={loading}
        onDelete={deleteUrl}
        onCopy={handleCopySuccess}
      />
    </div>
  );
}

export default App;

