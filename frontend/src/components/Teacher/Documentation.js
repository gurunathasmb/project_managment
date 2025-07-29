import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './TSidebar';
import '../../css/TeacherCss/documentation.css';

const Documentation = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/documentation`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      if (data.success) {
        setDocuments(data.docs);
      } else {
        handleError(data.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      handleError('Error fetching documentation');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word')) return '📝';
    return '📎';
  };

  const downloadFile = async (doc) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/documentation/download/${doc._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      handleError('Failed to download file');
    }
  };

  const addComment = async (docId, comment) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/documentation/comment/${docId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment })
      });

      const data = await response.json();
      if (data.success) {
        handleSuccess('Comment added successfully');
        fetchDocuments(); // Refresh the documents list
      } else {
        handleError(data.message || 'Failed to add comment');
      }
    } catch (error) {
      handleError('Failed to add comment');
    }
  };

  const updateStatus = async (docId, status) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/documentation/status/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        handleSuccess('Status updated successfully');
        fetchDocuments(); // Refresh the documents list
      } else {
        handleError(data.message || 'Failed to update status');
      }
    } catch (error) {
      handleError('Failed to update status');
    }
  };

  return (
    <div className="teacher-dashboard-container">
      <Sidebar />
      <div className="content-area">
        <h1>Team Documentation</h1>

        <div className="documents-section">
          {isLoading ? (
            <div className="loading-state">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="no-documents">
              <p>No documents shared with you yet</p>
            </div>
          ) : (
            <div className="documents-list">
              <div className="documents-header">
                <span>File</span>
                <span>Type</span>
                <span>Student</span>
                <span>Date</span>
                <span>Actions</span>
              </div>
              {documents.map((doc) => (
                <div key={doc._id} className="document-item">
                  <div className="document-info">
                    <span className="document-name">
                      {getFileIcon(doc.fileType)} {doc.fileName}
                    </span>
                    <span className="document-type">{doc.fileType}</span>
                    <span className="student-name">
                      {doc.studentId?.name || 'Unknown Student'}
                    </span>
                    <span className="document-date">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                  <div className="document-actions">
                    <button 
                      onClick={() => downloadFile(doc)}
                      className="action-button download"
                    >
                      Download
                    </button>
                    <select
                      value={doc.status || 'pending'}
                      onChange={(e) => updateStatus(doc._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <div className="comment-section">
                      <textarea
                        placeholder="Add a comment..."
                        className="comment-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const comment = e.target.value.trim();
                            if (comment) {
                              addComment(doc._id, comment);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      {doc.teacherComments && doc.teacherComments.length > 0 && (
                        <div className="comments-list">
                          {doc.teacherComments.map((comment, index) => (
                            <div key={index} className="comment-item">
                              <span className="comment-text">{comment.comment}</span>
                              <span className="comment-date">
                                {formatDate(comment.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Documentation; 