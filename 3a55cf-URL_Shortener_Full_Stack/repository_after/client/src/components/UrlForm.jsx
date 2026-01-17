import { useState } from 'react';

function UrlForm({ onSubmit, error, onClearError }) {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) return;
    
    setSubmitting(true);
    onClearError();
    
    const result = await onSubmit(url.trim(), customCode.trim());
    
    if (result.success) {
      setUrl('');
      setCustomCode('');
    }
    
    setSubmitting(false);
  };

  return (
    <div className="form-container">
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">Long URL *</label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url/that/needs/shortening"
            required
            disabled={submitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="customCode">Custom Short Code (optional)</label>
          <input
            id="customCode"
            type="text"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            placeholder="my-custom-code (4-20 chars, letters/numbers/hyphens)"
            disabled={submitting}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!url.trim() || submitting}
        >
          {submitting ? '⏳ Creating...' : '✨ Shorten URL'}
        </button>
      </form>
    </div>
  );
}

export default UrlForm;

