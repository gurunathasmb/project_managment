import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './TSidebar';
import '../../css/TeacherCss/tProjectStatus.css';

const TProjectStatus = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [studentUpdates, setStudentUpdates] = useState([]);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      setLoggedInUser(JSON.parse(userData));
    }
    fetchStudentUpdates();
  }, []);

  const fetchStudentUpdates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/student-updates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && Array.isArray(result.updates)) {
        const formattedUpdates = result.updates
          .map(update => ({
            ...update,
            studentName: update.studentId?.name || 'Unknown Student',
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first
        setStudentUpdates(formattedUpdates);
        
        // If there's a selected update, update its data
        if (selectedUpdate) {
          const updatedSelectedUpdate = formattedUpdates.find(u => u._id === selectedUpdate._id);
          if (updatedSelectedUpdate) {
            setSelectedUpdate(updatedSelectedUpdate);
          }
        }
      } else {
        handleError(result.message || 'Unexpected response format');
      }
    } catch (error) {
      handleError('Failed to fetch student updates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('User Logged out');
    setTimeout(() => window.location.href = '/login', 1000);
  };

  const handleSelectUpdate = (update) => {
    setSelectedUpdate(update);
    setCommentText('');
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

  const sendComment = async () => {
    if (!commentText.trim() || !selectedUpdate) {
      return handleError('Please select an update and write a comment');
    }

    try {
      setIsSending(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/send-comment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          updateId: selectedUpdate._id,
          comment: commentText.trim()
        })
      });

      const result = await response.json();
      if (result.success) {
        handleSuccess('Comment sent successfully!');
        setCommentText('');
        
        // Update the local state with the new comment
        if (result.update) {
          setSelectedUpdate(result.update);
          setStudentUpdates(prevUpdates => 
            prevUpdates.map(update => 
              update._id === result.update._id ? result.update : update
            )
          );
        } else {
          // Fallback to fetching all updates if the server doesn't return the updated project
          await fetchStudentUpdates();
        }
      } else {
        handleError(result.message);
      }
    } catch (error) {
      handleError('Failed to send comment');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="teacher-dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <h1>Project Status Updates</h1>

        <div className="student-updates-section">
          <h2>Student Updates & Feedback</h2>

          <div className="updates-container">
            <div className="updates-list">
              <h3>Recent Updates</h3>
              {isLoading ? (
                <div className="loading-state">Loading updates...</div>
              ) : studentUpdates.length === 0 ? (
                <div className="empty-state">
                  <p>No updates from students yet.</p>
                  <span>New updates will appear here when students send them.</span>
                </div>
              ) : (
                <ul className="student-updates">
                  {studentUpdates.map((update) => (
                    <li
                      key={update._id}
                      className={`update-item ${selectedUpdate?._id === update._id ? 'selected' : ''}`}
                      onClick={() => handleSelectUpdate(update)}
                    >
                      <div className="update-header">
                        <strong>{update.studentName}</strong>
                        <span className="timestamp">{formatDate(update.createdAt)}</span>
                      </div>
                      <p className="update-preview">
                        {update.message?.substring(0, 100)}
                        {update.message?.length > 100 ? '...' : ''}
                      </p>
                      {update.comments?.length > 0 && (
                        <div className="comment-count">
                          {update.comments.length} comment{update.comments.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="update-details">
              {selectedUpdate ? (
                <div className="selected-update">
                  <h3>Update from {selectedUpdate.studentName}</h3>
                  <div className="update-metadata">
                    <p><strong>Project:</strong> {selectedUpdate.projectTitle || 'Not specified'}</p>
                    <p><strong>Sent on:</strong> {formatDate(selectedUpdate.createdAt)}</p>
                  </div>
                  <div className="update-message">
                    <p>{selectedUpdate.message}</p>
                  </div>

                  <div className="previous-comments">
                    <h4>Previous Comments</h4>
                    {selectedUpdate?.comments?.length > 0 ? (
                      <ul className="comments-list">
                        {selectedUpdate.comments.map((comment, index) => (
                          <li key={index} className="comment-item">
                            <div className="comment-header">
                              <strong>{comment.sender === 'teacher' ? 'You' : selectedUpdate.studentName}</strong>
                              <span className="timestamp">{formatDate(comment.timestamp)}</span>
                            </div>
                            <p className="comment-text">{comment.text}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No previous comments.</p>
                    )}
                  </div>

                  <div className="comment-form">
                    <h4>Add Comment</h4>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write your feedback to the student..."
                      rows={4}
                      disabled={isSending}
                    />
                    <button 
                      onClick={sendComment} 
                      className="submit-button"
                      disabled={!commentText.trim() || isSending}
                    >
                      {isSending ? 'Sending...' : 'Send Comment'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-update-selected">
                  <p>Select an update from the list to view details and respond</p>
                  <span>You can provide feedback and track student progress here</span>
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
