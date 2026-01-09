import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './SSidebar';
import '../../css/StudentCss/sProjectStatus.css';

const SProjectStatus = () => {
  const token = localStorage.getItem('token');

  const [teachers, setTeachers] = useState([]);
  const [projectDetails, setProjectDetails] = useState(null);
  const [updates, setUpdates] = useState([]);

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  /* ================= FETCH PROJECT ================= */
  const fetchProject = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/student/project`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setProjectDetails(data.project);
  };

  /* ================= FETCH TEACHERS ================= */
  const fetchTeachers = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/student/teacher`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setTeachers(data.teachers);
  };

  /* ================= FETCH UPDATES (IMPORTANT) ================= */
  const fetchUpdates = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/student/project-updates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) setUpdates(data.updates);
  };

  useEffect(() => {
    fetchProject();
    fetchTeachers();
    fetchUpdates();
    // eslint-disable-next-line
  }, []);

  /* ================= SEND STATUS UPDATE ================= */
  const sendStatusUpdate = async () => {
    if (!selectedTeacherId || !statusMessage.trim()) {
      return handleError('Select teacher & write update');
    }

    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/student/send-status-update`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          projectName: projectDetails?.title || 'Not specified',
          message: statusMessage
        })
      }
    );

    const data = await res.json();
    if (data.success) {
      handleSuccess('Update sent');
      setStatusMessage('');
      setSelectedTeacherId('');
      fetchUpdates(); // 🔥 IMPORTANT
    }
  };

  return (
    <div className="student-dashboard-container">
      <Sidebar />
      <div className="content-area">
        <h1>Project Management</h1>

        {/* ================= PROJECT DETAILS ================= */}
        {projectDetails && (
          <div className="status-update-section">
            <h2>Project Details</h2>
            <div className="profile-row"><span>Title</span><p>{projectDetails.title}</p></div>
            <div className="profile-row"><span>Domain</span><p>{projectDetails.domain}</p></div>
            <div className="profile-row"><span>Tech Stack</span><p>{projectDetails.techStack?.join(', ')}</p></div>
            <div className="profile-row"><span>Phase</span><p>{projectDetails.currentPhase}</p></div>
            <div className="profile-row"><span>Description</span><p>{projectDetails.description}</p></div>
          </div>
        )}

        {/* ================= SEND UPDATE ================= */}
        <div className="status-update-section">
          <h2>Send Status Update</h2>

          <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
            <option value="">Select Teacher</option>
            {teachers.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          <textarea
            rows={4}
            placeholder="Describe your progress..."
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
          />

          <button className="submit-button" onClick={sendStatusUpdate}>
            Send Update
          </button>
        </div>

        {/* ================= TEACHER COMMENTS (FINAL FIX) ================= */}
        <div className="updates-history-section">
          <h2>Teacher Feedback</h2>

          {updates.length === 0 ? (
            <p>No updates yet</p>
          ) : (
            updates.map(update => (
              <div key={update._id} className="update-item">
                <p><strong>Message:</strong> {update.message}</p>
                <p><strong>Teacher:</strong> {update.teacherId?.name}</p>

                {update.comments.length > 0 && (
                  <div className="teacher-comments">
                    <h4>Comments</h4>
                    {update.comments.map((c, i) => (
                      <div key={i} className="comment-item">
                        <strong>{c.sender === 'teacher' ? 'Teacher' : 'You'}</strong>
                        <p>{c.text}</p>
                        <small>{new Date(c.timestamp).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default SProjectStatus;
