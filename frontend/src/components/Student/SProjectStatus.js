import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './SSidebar';
import '../../css/StudentCss/sProjectStatus.css';
// Keep all your imports and styles the same...

const SProjectStatus = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [project, setProject] = useState({ title: '', description: '' });
  const [teachers, setTeachers] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [projectUpdates, setProjectUpdates] = useState([]);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchProjectUpdates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/student/project-updates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setProjectUpdates(result.updates);
      } else {
        handleError(result.message);
      }
    } catch (error) {
      handleError("Failed to fetch project updates");
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      setLoggedInUser(JSON.parse(userData));
    }

    const fetchTeachers = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/student/teacher', {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project.title || !project.description || !selectedTeacherId) {
      return handleError("Title, Description, and Teacher are required");
    }

    try {
      const studentId = loggedInUser._id;
      const response = await fetch('http://localhost:8000/api/student/projects/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...project, teacherId: selectedTeacherId, studentId })
      });

      const result = await response.json();
      if (result.success) {
        handleSuccess("Project submitted successfully!");
        setProject({ title: '', description: '' });
        setSelectedTeacherId('');
        fetchProjectUpdates();  // Refresh updates
      } else {
        handleError(result.message);
      }
    } catch {
      handleError("Error submitting project");
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedTeacherId) {
      return handleError("Please select a teacher and write a message");
    }

    try {
      const response = await fetch('http://localhost:8000/api/student/send-status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          message: messageText,
          projectTitle: project.title || ''
        })
      });

      const result = await response.json();
      if (result.success) {
        handleSuccess("Status update sent!");
        setMessageText('');
        setSelectedTeacherId('');
        fetchProjectUpdates(); // Re-fetch to show new update
      } else {
        handleError(result.message);
      }
    } catch {
      handleError('Failed to send status update');
    }
  };

  const handleSelectUpdate = (update) => {
    setSelectedUpdate(update._id === selectedUpdate?._id ? null : update);
  };

  return (
    <div className="student-dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <h1>Welcome, {loggedInUser?.name}</h1>

        {/* Submit Project Section */}
        <div className="project-update-section">
          <h2>Submit Your Project</h2>
          <form onSubmit={handleSubmit} className="project-form">
            <div className="form-group">
              <label htmlFor="title">Project Title</label>
              <input id="title" name="title" value={project.title} onChange={handleChange} placeholder="Project Title" />
            </div>
            <div className="form-group">
              <label htmlFor="description">Project Description</label>
              <textarea id="description" name="description" value={project.description} onChange={handleChange} rows={5} />
            </div>
            <div className="form-group">
              <label>Select Teacher</label>
              <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                <option value="">-- Select Teacher --</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="submit-button">Submit Project</button>
          </form>
        </div>

        {/* Send Update Section */}
        <div className="teacher-message-section">
          <h2>Send Status Update to Teacher</h2>
          <div className="form-group">
            <label>Select Teacher</label>
            <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
              <option value="">-- Select Teacher --</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Status Update</label>
            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4} />
          </div>
          <button type="button" onClick={sendMessage} className="submit-button">Send Status Update</button>
        </div>

        {/* Project Update History */}
        <div className="message-history">
          <h2>Project Updates & Teacher Feedback</h2>
          {projectUpdates.length === 0 ? (
            <p>No status updates sent yet.</p>
          ) : (
            <ul className="updates-list">
              {projectUpdates.map((msg) => (
                <li
                  key={msg._id}
                  className={`update-item ${selectedUpdate?._id === msg._id ? 'expanded' : ''}`}
                  onClick={() => handleSelectUpdate(msg)}
                >
                  <div className="update-header">
                    <strong>To: {teachers.find(t => t._id === msg.teacherId)?.name || 'Teacher'}</strong>
                    <span className="timestamp">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="update-text">{msg.message}</p>

                  {selectedUpdate?._id === msg._id && msg.comments?.length > 0 && (
                    <div className="teacher-comments">
                      <h4>Teacher Comments</h4>
                      <ul className="comments-list">
                        {msg.comments.map((comment, index) => (
                          <li key={index} className="comment-item">
                            <div className="comment-header">
                              <strong>{comment.sender === 'teacher' ? (teachers.find(t => t._id === msg.teacherId)?.name || 'Teacher') : 'You'}</strong>
                              <span className="timestamp">{new Date(comment.timestamp).toLocaleString()}</span>
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
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default SProjectStatus;
