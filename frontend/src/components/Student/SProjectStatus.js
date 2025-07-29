import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './SSidebar';
import '../../css/StudentCss/sProjectStatus.css';
// Keep all your imports and styles the same...

const SProjectStatus = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectUpdates, setProjectUpdates] = useState([]);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchProjectUpdates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/student/project-updates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        console.log('Fetched updates:', result.updates);
        setProjectUpdates(result.updates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        handleError(result.message);
      }
    } catch (error) {
      handleError("Failed to fetch project updates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      setLoggedInUser(JSON.parse(userData));
    }

    const fetchTeachers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/student/teacher`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          setTeachers(result.teachers);
        } else {
          handleError(result.message);
        }
      } catch (error) {
        handleError("Failed to fetch teachers");
      }
    };

    fetchTeachers();
    fetchProjectUpdates();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('User Logged out');
    setTimeout(() => navigate('/login'), 1000);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedTeacherId || !projectName.trim()) {
      return handleError("Please fill in all fields (Teacher, Project Name, and Status Update)");
    }

    try {
      console.log('Sending update with project name:', projectName);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/student/send-status-update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          message: messageText,
          projectName: projectName.trim()
        })
      });

      const result = await response.json();
      console.log('Send update response:', result);
      if (result.success) {
        handleSuccess("Status update sent!");
        setMessageText('');
        setSelectedTeacherId('');
        setProjectName('');
        fetchProjectUpdates();
      } else {
        handleError(result.message);
      }
    } catch {
      handleError('Failed to send status update');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleSelectUpdate = (update) => {
    setSelectedUpdate(update._id === selectedUpdate?._id ? null : update);
  };

  return (
    <div className="student-dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <h1>Project Status Updates</h1>

        {/* Send Status Update Section */}
        <div className="status-update-section">
          <h2>Send Status Update to Teacher</h2>
          <div className="form-group">
            <label>Select Teacher</label>
            <select 
              value={selectedTeacherId} 
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="teacher-select"
            >
              <option value="">-- Select Teacher --</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter your project name"
              className="project-input"
            />
          </div>
          <div className="form-group">
            <label>Status Update</label>
            <textarea 
              value={messageText} 
              onChange={(e) => setMessageText(e.target.value)} 
              placeholder="Write your project status update here..."
              rows={4}
              className="status-textarea"
            />
          </div>
          <button type="button" onClick={sendMessage} className="submit-button">
            Send Status Update
          </button>
        </div>

        {/* Updates History Section */}
        <div className="updates-history-section">
          <h2>Updates History & Teacher Feedback</h2>
          {isLoading ? (
            <div className="loading-state">Loading updates...</div>
          ) : projectUpdates.length === 0 ? (
            <div className="empty-state">
              <p>No status updates sent yet.</p>
              <span>Your sent updates and teacher feedback will appear here.</span>
            </div>
          ) : (
            <div className="updates-container">
              <ul className="updates-list">
                {projectUpdates.map((update) => (
                  <li
                    key={update._id}
                    className={`update-item ${selectedUpdate?._id === update._id ? 'expanded' : ''}`}
                    onClick={() => handleSelectUpdate(update)}
                  >
                    <div className="update-header">
                      <div className="update-info">
                        <strong>To: {teachers.find(t => t._id === update.teacherId)?.name || 'Teacher'}</strong>
                      </div>
                      <span className="timestamp">{formatDate(update.createdAt)}</span>
                    </div>
                    <div className="update-details">
                      <span className="project-name">Project: {update.projectName}</span>
                      <p className="update-text">{update.message}</p>
                    </div>
                    {update.comments?.length > 0 && (
                      <div className="comment-count">
                        {update.comments.length} comment{update.comments.length !== 1 ? 's' : ''}
                      </div>
                    )}

                    {selectedUpdate?._id === update._id && update.comments?.length > 0 && (
                      <div className="teacher-comments">
                        <h4>Teacher Comments</h4>
                        <ul className="comments-list">
                          {update.comments.map((comment, index) => (
                            <li key={index} className="comment-item">
                              <div className="comment-header">
                                <strong>
                                  {comment.sender === 'teacher' 
                                    ? (teachers.find(t => t._id === update.teacherId)?.name || 'Teacher') 
                                    : 'You'}
                                </strong>
                                <span className="timestamp">{formatDate(comment.timestamp)}</span>
                              </div>
                              <p className="comment-text">{comment.text}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default SProjectStatus;
