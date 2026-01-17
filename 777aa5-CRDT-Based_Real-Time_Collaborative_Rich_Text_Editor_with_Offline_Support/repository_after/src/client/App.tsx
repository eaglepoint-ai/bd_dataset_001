/**
 * App Component - Minimal React Shell
 * 
 * Stage 2: Just enough UI to prove the Tiptap bridge works.
 */

import React, { useState, useEffect } from 'react';
import { Editor } from './components/Editor';
import { v4 as uuidv4 } from 'uuid';

export const App: React.FC = () => {
  const [documentId] = useState(() => {
    // Get document ID from URL or use default
    const params = new URLSearchParams(window.location.search);
    return params.get('doc') || 'demo-document';
  });

  const [siteId] = useState(() => {
    // Generate unique site ID for this client
    return uuidv4();
  });

  const [websocketUrl] = useState(() => {
    // Use environment variable or default
    return import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>CRDT Collaborative Editor</h1>
        <div className="status">
          <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          <span className="document-id">Document: {documentId}</span>
          <span className="site-id">Client: {siteId.slice(0, 8)}</span>
        </div>
      </header>
      
      <main className="app-main">
        <Editor 
          documentId={documentId}
          websocketUrl={websocketUrl}
          siteId={siteId}
        />
      </main>

      <footer className="app-footer">
        <p>Stage 2: Tiptap Bridge Demo - ByteDance Benchmark 777aa5</p>
      </footer>
    </div>
  );
};
