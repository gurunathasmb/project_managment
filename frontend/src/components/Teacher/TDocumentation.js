import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './TSidebar';
import '../../css/TeacherCss/tDocumentation.css';
import axios from '../Api/axios';

const TDocumentation = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();
  const [folderData, setFolderData] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      const user = JSON.parse(userData);
      setLoggedInUser(user);
      fetchDocumentation();
    }
  }, []);

  /* ================= FETCH DOCUMENTS (FIXED) ================= */
  const fetchDocumentation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        handleError('Please login again');
        navigate('/login');
        return;
      }

      // ✅ FIXED: Changed endpoint from /documents to /documentation
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/teacher/documentation`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Teacher documentation response:', response.data); // Debug log

      if (response.data.success) {
        // ✅ studentId should be populated from backend
        setFolderData(response.data.docs);
      } else {
        handleError(response.data.message || 'Failed to fetch documentation');
      }
    } catch (error) {
      handleError('Error fetching documentation');
      console.error('Fetch documentation error:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('User Logged out');
    setTimeout(() => navigate('/login'), 1000);
  };

  /* ================= DOWNLOAD ================= */
  const handleDownload = (item) => {
    showNotification(`Downloading file: ${item.fileName}`);
    const downloadUrl = `${process.env.REACT_APP_API_URL}/uploads/${item.fileName}`;
    window.open(downloadUrl, '_blank');
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      // ✅ FIXED: Changed endpoint from /documents to /documentation
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/teacher/documentation/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        handleSuccess('File deleted successfully!');
        fetchDocumentation();
      } else {
        handleError(response.data.message || 'Deletion failed');
      }
    } catch (error) {
      handleError('Error deleting file');
      console.error('Delete error:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  /* ================= UI HELPERS ================= */
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  /* ================= RENDER ================= */
  const renderHeader = () => (
    <div className="documentation-header">
      <h1>Welcome, {loggedInUser?.name || 'Teacher'}</h1>
      <h2>Team Documentation</h2>
    </div>
  );

  const renderTableHeader = () => (
    <div className="folder-row header">
      <div className="folder-column name">File</div>
      <div className="folder-column type">Type</div>
      <div className="folder-column student">Student</div>
      <div className="folder-column date">Date</div>
      <div className="folder-column actions">Actions</div>
    </div>
  );

  const renderFileRow = (item, index) => (
    <div
      key={item._id}
      className={`folder-row ${index % 2 === 0 ? 'even' : 'odd'}`}
    >
      <div className="folder-column name">{item.fileName}</div>
      <div className="folder-column type">{item.fileType || 'File'}</div>

      {/* ✅ STUDENT NAME FROM populated studentId */}
      <div className="folder-column student">
        {item.studentId?.name || 'Unknown'}
        <br />
        <small>{item.studentId?.email || ''}</small>
      </div>

      <div className="folder-column date">
        {formatDate(item.createdAt || item.uploadedAt)}
      </div>

      <div className="folder-column actions">
        <button
          className="action-button delete"
          onClick={() => handleDelete(item._id)}
        >
          Delete
        </button>
        <button
          className="action-button"
          onClick={() => handleDownload(item)}
        >
          Download
        </button>
      </div>
    </div>
  );

  const renderFileTable = () => (
    <div className="folder-container">
      {renderTableHeader()}
      {folderData.length === 0 ? (
        <div className="empty-folder-message">
          No documents uploaded by students yet.
        </div>
      ) : (
        folderData.map((item, index) =>
          renderFileRow(item, index)
        )
      )}
    </div>
  );

  return (
    <div className="student-dashboard-container repository-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area documentation-content">
        {renderHeader()}
        <div className="documentation-files">{renderFileTable()}</div>
        {notification && <div className="notification">{notification}</div>}
      </div>
      <ToastContainer />
    </div>
  );
};

export default TDocumentation;