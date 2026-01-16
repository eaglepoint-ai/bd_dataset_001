
import React, { useState, useEffect, useRef } from 'react';

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
  }
  
  close() {}
  send(data) {}
}

const SimpleMarkdown = ({ children }) => {
  const start = performance.now();
  while (performance.now() - start < 0.5) {} 
  return <div className="markdown">{children}</div>;
};

const Message = ({ message, isEditing, onStartEdit, onSaveEdit, onAddReaction }) => {
  const [editContent, setEditContent] = useState(message.content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const renderCount = useRef(0);
  renderCount.current++;

  console.log(`Rendering message ${message.id}`);

  const renderThread = (replies) => {
    if (!replies || replies.length === 0) return null;
    
    return (
      <div className="thread-replies">
        {replies.map(reply => (
          <div key={reply.id} className="thread-reply">
            <div className="avatar-small">{reply.author[0]}</div>
            <div className="reply-content">
              <strong>{reply.author}</strong>
              <SimpleMarkdown>{reply.content}</SimpleMarkdown>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleReactionClick = (emoji) => {
    onAddReaction(emoji);
    setShowReactionPicker(false);
  };

  return (
    <div className="message">
      <div className="avatar">{message.author[0]}</div>
      
      <div className="message-content">
        <div className="message-header">
          <strong>{message.author}</strong>
          <span className="timestamp">{message.timestamp}</span>
          <span className="render-count">Renders: {renderCount.current}</span>
        </div>
        
        {isEditing ? (
          <div className="edit-mode">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <button onClick={() => onSaveEdit(editContent)}>Save</button>
          </div>
        ) : (
          <div className="message-body">
            <SimpleMarkdown>{message.content}</SimpleMarkdown>
          </div>
        )}
        
        <div className="reactions-container">
          {Object.entries(message.reactions || {}).map(([emoji, count]) => (
            <span key={emoji} className="reaction-badge">
              {emoji} {count}
            </span>
          ))}
          
          <button 
            className="add-reaction-btn"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
          >
            +
          </button>
          
          {showReactionPicker && (
            <div className="reaction-picker">
              {['👍', '❤️', '😂', '😮', '🎉'].map(emoji => (
                <button key={emoji} onClick={() => handleReactionClick(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {renderThread(message.threadReplies)}
      </div>
      
      {!isEditing && message.canEdit && (
        <button className="edit-btn" onClick={onStartEdit}>Edit</button>
      )}
    </div>
  );
};

const ChatWindow = ({ websocketUrl }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const initialMessages = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      author: `User${(i % 5) + 1}`,
      content: `This is message #${i + 1}. **Markdown** rendering is supported!`,
      timestamp: new Date(Date.now() - (100 - i) * 60000).toLocaleTimeString(),
      avatar: `U${(i % 5) + 1}`,
      reactions: i % 3 === 0 ? { '👍': 2, '❤️': 1 } : {},
      threadReplies: i % 5 === 0 ? [
        { id: `${i}-1`, author: 'Reply User', content: 'Good point!', avatar: 'R' }
      ] : [],
      canEdit: i % 4 === 0
    }));
    
    setMessages(initialMessages);

    const ws = new MockWebSocket(websocketUrl);
    
    ws.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      
      if (newMessage.type === 'new_message') {
        setMessages(prev => [...prev, newMessage.data]);
      } else if (newMessage.type === 'edit_message') {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.data.id ? { ...msg, ...newMessage.data } : msg
        ));
      } else if (newMessage.type === 'add_reaction') {
        setMessages(prev => prev.map(msg => {
          if (msg.id === newMessage.messageId) {
            const reactions = { ...msg.reactions };
            reactions[newMessage.emoji] = (reactions[newMessage.emoji] || 0) + 1;
            return { ...msg, reactions };
          }
          return msg;
        }));
      }
    };

    return () => ws.close();
  }, [websocketUrl]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        author: 'You',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString(),
        avatar: 'Y',
        reactions: {},
        threadReplies: [],
        canEdit: true
      };
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
    }
  };

  const handleEditMessage = (id, newContent) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, content: newContent } : msg
    ));
    setEditingId(null);
  };

  const handleAddReaction = (messageId, emoji) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  return (
    <div className="chat-window">
      
      <div className="message-list">
        {messages.map(message => (
          <Message
            key={message.id}
            message={message}
            isEditing={editingId === message.id}
            onStartEdit={() => setEditingId(message.id)}
            onSaveEdit={(content) => handleEditMessage(message.id, content)}
            onAddReaction={(emoji) => handleAddReaction(message.id, emoji)}
          />
        ))}
      </div>
      
      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type here and watch render counts..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f5f5f5;
        }
        
        .app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .chat-window {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          height: 900px;
        }
        
        .performance-banner {
          background: #fff3cd;
          border-bottom: 2px solid #ffc107;
          padding: 15px 20px;
          font-weight: 600;
          text-align: center;
          color: #856404;
        }
        
        .message-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        
        .message {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px;
          border-radius: 8px;
          background: #f8f9fa;
          transition: background 0.2s;
          position: relative;
        }
        
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          flex-shrink: 0;
        }
        
        .message-content {
          flex: 1;
        }
        
        .message-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        
        .message-header strong {
          color: #333;
        }
        
        .timestamp {
          color: #6c757d;
          font-size: 12px;
        }
        
        .render-count {
          background: #dc3545;
          color: white;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          animation: pulse 0.3s ease-in-out;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .message-body {
          margin-bottom: 8px;
          color: #495057;
          line-height: 1.5;
        }
        
        .markdown {
          word-wrap: break-word;
        }
        
        .reactions-container {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 8px;
        }
        
        .reaction-badge {
          background: white;
          border: 1px solid #dee2e6;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .reaction-badge:hover {
          background: #e7f5ff;
          border-color: #007bff;
        }
        
        .add-reaction-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid #dee2e6;
          background: white;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .add-reaction-btn:hover {
          background: #f8f9fa;
          transform: scale(1.1);
        }
        
        .reaction-picker {
          display: flex;
          gap: 4px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .reaction-picker button {
          padding: 6px 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 18px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        
        .reaction-picker button:hover {
          background: #f8f9fa;
        }
        
        .thread-replies {
          margin-top: 12px;
          padding-left: 16px;
          border-left: 2px solid #dee2e6;
        }
        
        .thread-reply {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .avatar-small {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: bold;
          flex-shrink: 0;
        }
        
        .reply-content {
          font-size: 13px;
          color: #495057;
        }
        
        .edit-mode {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .edit-mode textarea {
          padding: 8px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          min-height: 60px;
        }
        
        .edit-mode button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          background: #28a745;
          color: white;
          align-self: flex-start;
        }
        
        .edit-mode button:hover {
          background: #218838;
        }
        
        .edit-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 6px 12px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .message:hover .edit-btn {
          opacity: 1;
        }
        
        .edit-btn:hover {
          background: #5a6268;
        }
        
        .input-container {
          display: flex;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #dee2e6;
          background: #f8f9fa;
        }
        
        .input-container input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .input-container input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }
        
        .input-container button {
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .input-container button:hover {
          background: #0056b3;
        }
        
        .info-box {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .info-box h2 {
          margin-bottom: 12px;
          color: #333;
        }
        
        .info-box p {
          color: #495057;
          line-height: 1.6;
          margin-bottom: 8px;
        }
        
        .info-box ul {
          margin-left: 20px;
          color: #495057;
        }
        
        .info-box li {
          margin-bottom: 6px;
        }
        
        .info-box code {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }
      `}</style>
      
      
      <ChatWindow websocketUrl="wss://example.com/chat" />
    </div>
  );
}