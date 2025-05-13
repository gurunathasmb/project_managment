import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './TSidebar';
import '../../css/TeacherCss/tDocumentation.css';
import axios from 'axios';

const TDocumentation = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();
  const [folderData, setFolderData] = useState([]);
  const [notification, setNotification] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      const user = JSON.parse(userData);
      setLoggedInUser(user);
      fetchDocumentation();
    }
  }, []);

  const fetchDocumentation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/teacher/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        const docsWithStudentNames = await Promise.all(
          response.data.docs.map(async (doc) => {
            // Fetch student info using the studentId from the populated student data
            const studentResponse = await axios.get(`${API_URL}/api/teacher/student-updates`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            // Find the student name and email from the updates data
            const student = studentResponse.data.updates.find(update => update.studentId._id === doc.studentId);

            if (student) {
              return { ...doc, studentName: student.studentId.name, studentEmail: student.studentId.email };
            }
            return doc;
          })
        );
        setFolderData(docsWithStudentNames);
      } else {
        handleError(response.data.message || 'Failed to fetch documentation.');
      }
    } catch (error) {
      handleError('Error fetching documentation.');
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('User Logged out');
    setTimeout(() => navigate('/login'), 1000);
  };

  const handleDownload = (item) => {
    showNotification(`Downloading file: ${item.fileName}`);
    const downloadUrl = `${API_URL}/uploads/${item.fileName}`;
    window.open(downloadUrl, '_blank');
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/api/teacher/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        handleSuccess('File deleted successfully!');
        fetchDocumentation();
      } else {
        handleError(response.data.message || 'Deletion failed.');
      }
    } catch (error) {
      handleError('Error deleting file.');
      console.error(error);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const renderFileRow = (item, index) => (
    <div key={item._id} className={`folder-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
      <div className="folder-column name">{item.fileName}</div>
      <div className="folder-column type">{item.fileType || 'File'}</div>
      {/* Display student name and email */}
      <div className="folder-column student">
        {item.studentName || 'Unknown'} 
      </div>
      <div className="folder-column date">{formatDate(item.uploadedAt)}</div>
      <div className="folder-column actions">
        <button className="action-button delete" onClick={() => handleDelete(item._id)}>Delete</button>
        <button className="action-button" onClick={() => handleDownload(item)}>Download</button>
      </div>
    </div>
  );

  const renderFileTable = () => (
    <div className="folder-container">
      {renderTableHeader()}
      {folderData.length === 0 ? (
        <div className="empty-folder-message">No documents uploaded by students yet.</div>
      ) : (
        folderData.map((item, index) => renderFileRow(item, index))
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
