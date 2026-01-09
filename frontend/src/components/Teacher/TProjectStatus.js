import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './TSidebar';
import '../../css/TeacherCss/tProjectStatus.css';

const TProjectStatus = () => {
  const token = localStorage.getItem('token');

  const [studentUpdates, setStudentUpdates] = useState([]);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  /* ================= FETCH STUDENT UPDATES ================= */
  const fetchStudentUpdates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/teacher/student-updates`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      if (data.success && Array.isArray(data.updates)) {
        setStudentUpdates(
          data.updates
            .map(update => ({
              ...update,
              studentName: update.studentId?.name || 'Unknown Student'
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
      } else {
        handleError(data.message || 'No updates found');
      }
    } catch (error) {
      handleError('Failed to fetch student updates');
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= INIT ================= */
  useEffect(() => {
    fetchStudentUpdates();
    // eslint-disable-next-line
  }, []);

  /* ================= SELECT UPDATE ================= */
  const handleSelectUpdate = (update) => {
    setSelectedUpdate(update);
    setCommentText('');
  };

  /* ================= SEND COMMENT ================= */
  const sendComment = async () => {
    if (!commentText.trim() || !selectedUpdate) {
      return handleError('Please write a comment');
    }

    try {
      setIsSending(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/teacher/send-comment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            updateId: selectedUpdate._id,
            comment: commentText.trim()
          })
        }
      );

      const data = await res.json();

      if (data.success) {
        handleSuccess('Comment sent');
        setCommentText('');

        if (data.update) {
          setSelectedUpdate(data.update);
          setStudentUpdates(prev =>
            prev.map(u => (u._id === data.update._id ? data.update : u))
          );
        } else {
          fetchStudentUpdates();
        }
      } else {
        handleError(data.message);
      }
    } catch (error) {
      handleError('Failed to send comment');
    } finally {
      setIsSending(false);
    }
  };

  /* ================= DATE FORMAT ================= */
  const formatDate = (date) =>
    new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <div className="teacher-dashboard-container">
      <Sidebar />
      <div className="content-area">
        <h1>Project Status Updates</h1>

        <div className="student-updates-section">
          <h2>Student Updates & Feedback</h2>

          <div className="updates-container">
            {/* ================= LEFT LIST ================= */}
            <div className="updates-list">
              <h3>Recent Updates</h3>

              {isLoading ? (
                <div className="loading-state">Loading updates...</div>
              ) : studentUpdates.length === 0 ? (
                <div className="empty-state">
                  <p>No updates from students yet</p>
                  <span>Updates will appear once students submit them</span>
                </div>
              ) : (
                <ul className="student-updates">
                  {studentUpdates.map(update => (
                    <li
                      key={update._id}
                      className={`update-item ${
                        selectedUpdate?._id === update._id ? 'selected' : ''
                      }`}
                      onClick={() => handleSelectUpdate(update)}
                    >
                      <div className="update-header">
                        <strong>{update.studentName}</strong>
                        <span className="timestamp">
                          {formatDate(update.createdAt)}
                        </span>
                      </div>

                      <p className="update-preview">
                        {update.message?.slice(0, 100)}
                        {update.message?.length > 100 && '...'}
                      </p>

                      {update.comments?.length > 0 && (
                        <div className="comment-count">
                          {update.comments.length} comment
                          {update.comments.length !== 1 && 's'}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ================= RIGHT DETAILS ================= */}
            <div className="update-details">
              {selectedUpdate ? (
                <div className="selected-update">
                  <h3>Update from {selectedUpdate.studentName}</h3>

                  <div className="update-metadata">
                    <p>
                      <strong>Project:</strong>{' '}
                      {selectedUpdate.projectName || 'Not specified'}
                    </p>
                    <p>
                      <strong>Sent on:</strong>{' '}
                      {formatDate(selectedUpdate.createdAt)}
                    </p>
                  </div>

                  <div className="update-message">
                    <p>{selectedUpdate.message}</p>
                  </div>

                  {/* ===== COMMENTS ===== */}
                  <div className="previous-comments">
                    <h4>Previous Comments</h4>

                    {selectedUpdate.comments?.length > 0 ? (
                      <ul className="comments-list">
                        {selectedUpdate.comments.map((c, i) => (
                          <li key={i} className="comment-item">
                            <div className="comment-header">
                              <strong>
                                {c.sender === 'teacher'
                                  ? 'You'
                                  : selectedUpdate.studentName}
                              </strong>
                              <span className="timestamp">
                                {formatDate(c.timestamp)}
                              </span>
                            </div>
                            <p className="comment-text">{c.text}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No comments yet</p>
                    )}
                  </div>

                  {/* ===== ADD COMMENT ===== */}
                  <div className="comment-form">
                    <h4>Add Comment</h4>
                    <textarea
                      rows={4}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write your feedback..."
                      disabled={isSending}
                    />
                    <button
                      className="submit-button"
                      onClick={sendComment}
                      disabled={!commentText.trim() || isSending}
                    >
                      {isSending ? 'Sending...' : 'Send Comment'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-update-selected">
                  <p>Select a student update to view details</p>
                  <span>Provide feedback and track progress here</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default TProjectStatus;
