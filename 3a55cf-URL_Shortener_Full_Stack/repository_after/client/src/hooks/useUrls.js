import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:3001/api';

const ERROR_MESSAGES = {
  INVALID_URL: 'Please enter a valid URL (must start with http:// or https://)',
  INVALID_CODE: 'Invalid custom code. Use 4-20 characters with letters, numbers, or hyphens only.',
  DUPLICATE_CODE: 'This custom code is already taken. Please choose another.',
  RESERVED_CODE: 'This code is reserved and cannot be used.',
  NOT_FOUND: 'URL not found.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Unable to connect to server. Please check your connection.'
};

function useUrls() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchUrls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/urls`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch URLs');
      }
      
      const data = await response.json();
      setUrls(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUrl = useCallback(async (url, customCode) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${API_BASE}/urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url, 
          customCode: customCode || null 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = ERROR_MESSAGES[data.code] || data.error || ERROR_MESSAGES.INTERNAL_ERROR;
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      setUrls(prev => [data, ...prev]);
      setSuccess(data);
      
      return { success: true, data };
    } catch (err) {
      console.error('Create error:', err);
      setError(ERROR_MESSAGES.NETWORK_ERROR);
      return { success: false, error: ERROR_MESSAGES.NETWORK_ERROR };
    }
  }, []);

  const deleteUrl = useCallback(async (id) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE}/urls/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }
      
      setUrls(prev => prev.filter(url => url.id !== id));
      
      return { success: true };
    } catch (err) {
      console.error('Delete error:', err);
      setError(ERROR_MESSAGES.INTERNAL_ERROR);
      return { success: false, error: err.message };
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccess(null), []);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  return {
    urls,
    loading,
    error,
    success,
    createUrl,
    deleteUrl,
    refetch: fetchUrls,
    clearError,
    clearSuccess
  };
}

export default useUrls;
