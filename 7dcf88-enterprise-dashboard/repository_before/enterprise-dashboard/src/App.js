import React, { useState, useEffect } from 'react';

const mockAPI = {
  async getUserProfile(userId) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: userId,
      name: 'John Doe',
      email: 'john.doe@company.com',
      avatar: 'JD',
      role: 'Senior Developer'
    };
  },
  
  async getProjects(userId) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return [
      { id: 1, name: 'E-Commerce Platform', status: 'active', progress: 75 },
      { id: 2, name: 'Mobile App Redesign', status: 'active', progress: 45 },
      { id: 3, name: 'API Gateway', status: 'planning', progress: 10 }
    ];
  },
  
  async getProjectTasks(projectId) {
    await new Promise(resolve => setTimeout(resolve, 250));
    return [
      { id: `${projectId}-1`, title: 'Setup infrastructure', completed: true, projectId },
      { id: `${projectId}-2`, title: 'Implement authentication', completed: false, projectId },
      { id: `${projectId}-3`, title: 'Write unit tests', completed: false, projectId }
    ];
  },
  
  async getNotifications(userId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [
      { id: 1, type: 'mention', message: 'You were mentioned in a comment', unread: true, timestamp: '5m ago' },
      { id: 2, type: 'task', message: 'Task deadline approaching', unread: true, timestamp: '1h ago' },
      { id: 3, type: 'approval', message: 'PR approved', unread: false, timestamp: '3h ago' }
    ];
  },
  
  async getTeamMembers(projectId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [
      { id: 1, name: 'Alice Smith', role: 'Designer', avatar: 'AS' },
      { id: 2, name: 'Bob Johnson', role: 'Backend Dev', avatar: 'BJ' },
      { id: 3, name: 'Carol White', role: 'QA Engineer', avatar: 'CW' }
    ];
  }
};


const UserProfile = ({ userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiCallCount = React.useRef(0);

  useEffect(() => {
    const fetchProfile = async () => {
      apiCallCount.current++;
      console.log(`🔴 API Call #${apiCallCount.current}: getUserProfile(${userId})`);
      setLoading(true);
      const data = await mockAPI.getUserProfile(userId);
      setProfile(data);
      setLoading(false);
    };
    
    fetchProfile();
  }, [userId]);

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="user-profile card">
      <div className="profile-header">
        <div className="avatar large">{profile.avatar}</div>
        <div className="profile-info">
          <h2>{profile.name}</h2>
          <p className="email">{profile.email}</p>
          <span className="role-badge">{profile.role}</span>
        </div>
      </div>
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const apiCallCount = React.useRef(0);

  useEffect(() => {
    const fetchTasks = async () => {
      apiCallCount.current++;
      console.log(`🔴 API Call #${apiCallCount.current}: getProjectTasks(${project.id})`);
      setLoadingTasks(true);
      const data = await mockAPI.getProjectTasks(project.id);
      setTasks(data);
      setLoadingTasks(false);
    };
    
    fetchTasks();
  }, [project.id]);

  useEffect(() => {
    const fetchTeam = async () => {
      apiCallCount.current++;
      console.log(`🔴 API Call #${apiCallCount.current}: getTeamMembers(${project.id})`);
      setLoadingTeam(true);
      const data = await mockAPI.getTeamMembers(project.id);
      setTeam(data);
      setLoadingTeam(false);
    };
    
    fetchTeam();
  }, [project.id]);

  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div className="project-card card">
      <div className="project-header">
        <h3>{project.name}</h3>
        <span className={`status-badge ${project.status}`}>{project.status}</span>
      </div>
      
      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
        </div>
        <span className="progress-text">{project.progress}% complete</span>
      </div>

      <div className="tasks-section">
        <h4>Tasks</h4>
        {loadingTasks ? (
          <div className="loading-small">Loading tasks...</div>
        ) : (
          <div className="task-summary">
            {completedTasks} of {tasks.length} completed
          </div>
        )}
      </div>

      <div className="team-section">
        <h4>Team</h4>
        {loadingTeam ? (
          <div className="loading-small">Loading team...</div>
        ) : (
          <div className="team-avatars">
            {team.map(member => (
              <div key={member.id} className="avatar small" title={member.name}>
                {member.avatar}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectsList = ({ userId }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiCallCount = React.useRef(0);

  useEffect(() => {
    const fetchProjects = async () => {
      apiCallCount.current++;
      console.log(`🔴 API Call #${apiCallCount.current}: getProjects(${userId})`);
      setLoading(true);
      const data = await mockAPI.getProjects(userId);
      setProjects(data);
      setLoading(false);
    };
    
    fetchProjects();
  }, [userId]);

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="projects-list">
      <h2>Active Projects</h2>
      <div className="projects-grid">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

const Notifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiCallCount = React.useRef(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      apiCallCount.current++;
      console.log(`🔴 API Call #${apiCallCount.current}: getNotifications(${userId})`);
      setLoading(true);
      const data = await mockAPI.getNotifications(userId);
      setNotifications(data);
      setLoading(false);
    };
    
    fetchNotifications();
  }, [userId]);

  if (loading) return <div className="loading">Loading notifications...</div>;

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="notifications card">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </div>
      <div className="notifications-list">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
            <div className="notification-icon">{notif.type === 'mention' ? '💬' : notif.type === 'task' ? '✓' : '👍'}</div>
            <div className="notification-content">
              <p>{notif.message}</p>
              <span className="timestamp">{notif.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = ({ userId = 1 }) => {
  const [totalAPICalls, setTotalAPICalls] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState(null);
  const [loadEndTime, setLoadEndTime] = useState(null);

  useEffect(() => {
    setLoadStartTime(Date.now());
    
    const timer = setTimeout(() => {
      setLoadEndTime(Date.now());
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalAPICalls(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const loadTime = loadEndTime && loadStartTime ? ((loadEndTime - loadStartTime) / 1000).toFixed(1) : null;

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="left-column">
          <UserProfile userId={userId} />
          <Notifications userId={userId} />
        </div>
        
        <div className="right-column">
          <ProjectsList userId={userId} />
        </div>
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
          background: #f0f2f5;
        }
        
        .app {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .performance-warning {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border: 2px solid #ffc107;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .performance-warning strong {
          color: #856404;
          font-size: 18px;
          display: block;
          margin-bottom: 10px;
        }
        
        .performance-warning p {
          color: #856404;
          margin-bottom: 8px;
          line-height: 1.6;
        }
        
        .performance-warning ul {
          margin: 12px 0 12px 20px;
          color: #856404;
        }
        
        .performance-warning li {
          margin-bottom: 4px;
        }
        
        .console-hint {
          background: rgba(0,0,0,0.1);
          padding: 8px 12px;
          border-radius: 4px;
          margin-top: 12px;
          font-weight: 600;
        }
        
        .dashboard {
          animation: fadeIn 0.5s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 20px;
        }
        
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #6c757d;
          font-style: italic;
        }
        
        .loading-small {
          padding: 10px;
          color: #6c757d;
          font-size: 13px;
          font-style: italic;
        }
        
        /* User Profile */
        .user-profile .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .avatar {
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avatar.large {
          width: 64px;
          height: 64px;
          font-size: 24px;
        }
        
        .avatar.small {
          width: 32px;
          height: 32px;
          font-size: 12px;
        }
        
        .profile-info h2 {
          margin-bottom: 4px;
          color: #333;
        }
        
        .email {
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .role-badge {
          background: #e7f5ff;
          color: #007bff;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        /* Notifications */
        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .notifications h2 {
          font-size: 18px;
          color: #333;
        }
        
        .unread-badge {
          background: #dc3545;
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .notification-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          transition: background 0.2s;
        }
        
        .notification-item:hover {
          background: #f8f9fa;
        }
        
        .notification-item.unread {
          background: #e7f5ff;
        }
        
        .notification-icon {
          font-size: 20px;
        }
        
        .notification-content p {
          color: #333;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .timestamp {
          color: #6c757d;
          font-size: 12px;
        }
        
        /* Projects */
        .projects-list h2 {
          margin-bottom: 16px;
          color: #333;
        }
        
        .projects-grid {
          display: grid;
          gap: 16px;
        }
        
        .project-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .project-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .project-header h3 {
          color: #333;
          font-size: 16px;
        }
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }
        
        .status-badge.planning {
          background: #fff3cd;
          color: #856404;
        }
        
        .progress-section {
          margin-bottom: 16px;
        }
        
        .progress-bar {
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 12px;
          color: #6c757d;
        }
        
        .tasks-section, .team-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }
        
        .tasks-section h4, .team-section h4 {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .task-summary {
          color: #333;
          font-size: 14px;
        }
        
        .team-avatars {
          display: flex;
          gap: 8px;
        }
      `}</style>
      <Dashboard userId={1} />
    </div>
  );
}