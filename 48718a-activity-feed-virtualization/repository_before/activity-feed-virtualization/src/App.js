import React, { useState, useEffect, useRef } from 'react';

const generateActivities = (count) => {
  const types = ['comment', 'log', 'event', 'mention', 'update', 'alert'];
  const users = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry'];
  const actions = [
    'commented on issue #',
    'updated pull request #',
    'mentioned you in',
    'deployed to production',
    'created a new branch',
    'merged pull request #',
    'opened issue #',
    'closed issue #',
    'assigned you to',
    'reviewed code in'
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const itemNumber = Math.floor(Math.random() * 9999) + 1;
    
    return {
      id: i + 1,
      type,
      user,
      message: `${user} ${action}${itemNumber}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      details: `This is additional detail text for activity ${i + 1}. It contains information about the specific action taken, including contextual metadata, file changes, and other relevant information that might be useful to the user.`,
      avatar: user.substring(0, 2).toUpperCase(),
      hasAttachment: Math.random() > 0.7,
      isUnread: Math.random() > 0.5,
      tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => 
        ['bug', 'feature', 'urgent', 'review', 'backend', 'frontend'][Math.floor(Math.random() * 6)]
      )
    };
  });
};

const ActivityItem = ({ activity, index }) => {
  const renderCount = useRef(0);
  renderCount.current++;
  
  const expensiveComputation = () => {
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += Math.sqrt(i);
    }
    return result;
  };
  
  const computedValue = expensiveComputation();
  
  const getTypeIcon = (type) => {
    const icons = {
      comment: '💬',
      log: '📋',
      event: '📅',
      mention: '@',
      update: '🔄',
      alert: '🔔'
    };
    return icons[type] || '📌';
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={`activity-item ${activity.isUnread ? 'unread' : ''}`}>
      <div className="activity-left">
        <div className={`avatar ${activity.type}`}>
          {activity.avatar}
        </div>
      </div>
      
      <div className="activity-content">
        <div className="activity-header">
          <span className="activity-user">{activity.user}</span>
          <span className="activity-type-icon">{getTypeIcon(activity.type)}</span>
          <span className="activity-timestamp">{formatTimestamp(activity.timestamp)}</span>
          <span className="render-badge">R:{renderCount.current}</span>
        </div>
        
        <div className="activity-message">
          {activity.message}
        </div>
        
        <div className="activity-details">
          {activity.details}
        </div>
        
        <div className="activity-footer">
          <div className="activity-tags">
            {activity.tags.map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>
          
          {activity.hasAttachment && (
            <span className="attachment-badge">📎 Attachment</span>
          )}
        </div>
      </div>
      
      <div className="activity-actions">
        <button className="action-btn">👁️</button>
        <button className="action-btn">⭐</button>
        <button className="action-btn">...</button>
      </div>
    </div>
  );
};

const ActivityFeed = ({ itemCount = 5000 }) => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [fps, setFps] = useState(60);
  const containerRef = useRef(null);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() });

  useEffect(() => {
    setTimeout(() => {
      const data = generateActivities(itemCount);
      setActivities(data);
      setLoading(false);
    }, 500);
  }, [itemCount]);

  useEffect(() => {
    // FPS Monitor
    let animationId;
    const measureFPS = () => {
      fpsRef.current.frames++;
      const now = performance.now();
      const elapsed = now - fpsRef.current.lastTime;
      
      if (elapsed >= 1000) {
        setFps(Math.round((fpsRef.current.frames * 1000) / elapsed));
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = now;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleScroll = (e) => {
    const position = e.target.scrollTop;
    setScrollPosition(position);
  };

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  const unreadCount = activities.filter(a => a.isUnread).length;

  if (loading) {
    return <div className="loading">Generating {itemCount.toLocaleString()} activities...</div>;
  }

  return (
    <div className="activity-feed-container">
      <div className="feed-header">
        <div className="header-left">
          <h2>Activity Feed</h2>
          <span className="item-count">{filteredActivities.length.toLocaleString()} items</span>
          {unreadCount > 0 && <span className="unread-count">{unreadCount} unread</span>}
        </div>
        
        <div className="filter-controls">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'comment' ? 'active' : ''} 
            onClick={() => setFilter('comment')}
          >
            💬 Comments
          </button>
          <button 
            className={filter === 'event' ? 'active' : ''} 
            onClick={() => setFilter('event')}
          >
            📅 Events
          </button>
          <button 
            className={filter === 'alert' ? 'active' : ''} 
            onClick={() => setFilter('alert')}
          >
            🔔 Alerts
          </button>
        </div>
      </div>

      <div className="performance-metrics">
        <div className={`fps-indicator ${fps < 30 ? 'critical' : fps < 50 ? 'warning' : 'good'}`}>
          FPS: {fps}
        </div>
        <div className="scroll-position">
          Scroll: {Math.round(scrollPosition)}px
        </div>
        <div className="dom-nodes">
          DOM Nodes: {filteredActivities.length.toLocaleString()}
        </div>
      </div>

      <div 
        className="activity-list" 
        ref={containerRef}
        onScroll={handleScroll}
      >
        {filteredActivities.map((activity, index) => (
          <ActivityItem 
            key={activity.id} 
            activity={activity} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [itemCount, setItemCount] = useState(5000);

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f0f2f5;
          overflow: hidden;
        }
        
        .app {
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 20px;
        }
        
        .warning-banner {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .warning-banner h2 {
          margin-bottom: 10px;
          font-size: 20px;
        }
        
        .warning-banner p {
          margin-bottom: 8px;
          line-height: 1.6;
        }
        
        .warning-banner ul {
          margin: 12px 0 12px 20px;
        }
        
        .warning-banner li {
          margin-bottom: 6px;
        }
        
        .controls {
          background: white;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .controls label {
          font-weight: 600;
          color: #333;
        }
        
        .controls input {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          width: 120px;
        }
        
        .controls button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        
        .controls button:hover {
          background: #0056b3;
        }
        
        .activity-feed-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        
        .feed-header {
          padding: 20px;
          border-bottom: 2px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .feed-header h2 {
          color: #333;
          font-size: 20px;
        }
        
        .item-count {
          background: #e7f5ff;
          color: #007bff;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .unread-count {
          background: #dc3545;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .filter-controls {
          display: flex;
          gap: 8px;
        }
        
        .filter-controls button {
          padding: 8px 16px;
          border: 1px solid #dee2e6;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .filter-controls button:hover {
          background: #f8f9fa;
        }
        
        .filter-controls button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .performance-metrics {
          display: flex;
          gap: 16px;
          padding: 12px 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          font-size: 13px;
          font-weight: 600;
        }
        
        .fps-indicator {
          padding: 4px 12px;
          border-radius: 4px;
        }
        
        .fps-indicator.good {
          background: #d4edda;
          color: #155724;
        }
        
        .fps-indicator.warning {
          background: #fff3cd;
          color: #856404;
        }
        
        .fps-indicator.critical {
          background: #f8d7da;
          color: #721c24;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .scroll-position, .dom-nodes {
          color: #6c757d;
        }
        
        .loading {
          padding: 60px;
          text-align: center;
          color: #6c757d;
          font-size: 18px;
        }
        
        .activity-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        
        .activity-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          margin-bottom: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 3px solid transparent;
          transition: all 0.2s;
        }
        
        .activity-item:hover {
          background: #e9ecef;
          transform: translateX(4px);
        }
        
        .activity-item.unread {
          background: #e7f5ff;
          border-left-color: #007bff;
        }
        
        .activity-left {
          flex-shrink: 0;
        }
        
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        
        .avatar.comment { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .avatar.log { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .avatar.event { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .avatar.mention { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        .avatar.update { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .avatar.alert { background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); }
        
        .activity-content {
          flex: 1;
          min-width: 0;
        }
        
        .activity-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        
        .activity-user {
          font-weight: 600;
          color: #333;
        }
        
        .activity-type-icon {
          font-size: 16px;
        }
        
        .activity-timestamp {
          color: #6c757d;
          font-size: 12px;
        }
        
        .render-badge {
          background: #ffc107;
          color: #333;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
          margin-left: auto;
        }
        
        .activity-message {
          color: #333;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .activity-details {
          color: #6c757d;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        
        .activity-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .activity-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        
        .tag {
          background: #dee2e6;
          color: #495057;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .attachment-badge {
          color: #6c757d;
          font-size: 12px;
        }
        
        .activity-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .action-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #dee2e6;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .action-btn:hover {
          background: #f8f9fa;
          transform: scale(1.1);
        }
      `}</style>
      <div className="controls">
        <label>Item Count:</label>
        <input 
          type="number" 
          value={itemCount} 
          onChange={(e) => setItemCount(Number(e.target.value))}
          min="100"
          max="10000"
          step="500"
        />
        <button onClick={() => window.location.reload()}>
          Reload with {itemCount.toLocaleString()} items
        </button>
      </div>
      
      <ActivityFeed key={itemCount} itemCount={itemCount} />
    </div>
  );
}