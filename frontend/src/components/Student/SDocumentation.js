import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './SSidebar';
import '../../css/StudentCss/sDocumentation.css';
import axios from 'axios';

const SDocumentation = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();
  const [folderData, setFolderData] = useState([]);
  const [notification, setNotification] = useState(null);
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      const user = JSON.parse(userData);
      setLoggedInUser(user);
      fetchDocumentation(user._id);
      fetchAssignedTeachers();
    }
  }, []);

  useEffect(() => {
    console.log('Folder Data:', folderData);  // Log folder data
    console.log('Assigned Teachers:', assignedTeachers);  // Log assigned teachers
  }, [folderData, assignedTeachers]);

  const fetchDocumentation = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        handleError('Please log in first.');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/student/documentation`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(response.data); // Add this line to check the response structure

      if (response.data.success) {
        setFolderData(response.data.docs);
      } else {
        handleError("Failed to fetch documentation");
      }
    } catch (error) {
      handleError("Error fetching documentation");
      console.error(error);
    }
  };

  const fetchAssignedTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        handleError('Please log in first.');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/student/teammember`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log(response.data); // Add this line to check the response structure

      if (response.data.success && response.data.team?.assignedTeacher) {
        const teacher = response.data.team.assignedTeacher;
        setAssignedTeachers([teacher]);

        const userData = localStorage.getItem('loggedInUser');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && teacher && teacher.students?.includes(user._id)) {
            setSelectedTeacher({ value: teacher._id, label: teacher.name });
          } else {
            setSelectedTeacher({ value: teacher._id, label: teacher.name });
          }
        }
      } else {
        console.warn("No assigned teacher found.");
      }
    } catch (error) {
      console.error("Error fetching assigned teacher:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('User Logged out');
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const handleUpload = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';

    fileInput.addEventListener('change', async function () {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/student/documentation/upload`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.data.success) {
            handleSuccess('File uploaded successfully!');
            fetchDocumentation(loggedInUser._id);
          } else {
            handleError(`Upload failed: ${response.data.message}`);
          }
        } catch (error) {
          handleError('Error uploading file.');
          console.error(error);
        }
      }
    });

    fileInput.click();
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/student/documentation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        handleSuccess('File deleted successfully!');
        fetchDocumentation(loggedInUser._id);
      } else {
        handleError(`Deletion failed: ${response.data.message}`);
      }
    } catch (error) {
      handleError('Error deleting file.');
      console.error(error);
    }
  };

  const handleDownload = (item) => {
    showNotification(`Downloading file: ${item.fileName}`);
    const downloadUrl = `${process.env.REACT_APP_API_URL}/uploads/${item.fileName}`;
    window.open(downloadUrl, '_blank');
  };

  const createNewFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      handleError('Create Folder functionality is under development');
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const renderHeader = () => (
    <div className="documentation-header">
      <h1>Welcome, {loggedInUser?.name || 'Student'}</h1>
      <h2>Documentation</h2>
      <div className="teacher-info">
        <p>
          Your documents are shared with:&nbsp;
          {assignedTeachers.length > 0
            ? assignedTeachers.map((t) => t.name).join(', ')
            : 'No teachers assigned'}
        </p>
      </div>
    </div>
  );

  const renderActionButtons = () => (
    <div className="action-buttons">
      <button className="upload-button primary-button" onClick={handleUpload}>
        <span className="plus-icon">+</span> Upload
      </button>
      <button className="new-folder-button secondary-button" onClick={createNewFolder}>
        New Folder
      </button>
    </div>
  );

  const renderTableHeader = () => (
    <div className="folder-row header">
      <div className="folder-column name">Name</div>
      <div className="folder-column type">Type</div>
      <div className="folder-column date">Date Modified</div>
      <div className="folder-column actions">Actions</div>
    </div>
  );

  const renderFileRow = (item, index) => (
    <div key={item._id} className={`folder-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
      <div className="folder-column name">
        <span className={`icon-${item.fileType || 'file'}`}></span>
        {item.fileName}
      </div>
      <div className="folder-column type">{item.fileType || 'File'}</div>
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
        <div className="empty-folder-message">No documents uploaded yet.</div>
      ) : (
        folderData.map((item, index) => renderFileRow(item, index))
      )}
    </div>
  );

  const renderNotification = () =>
    notification && <div className="notification">{notification}</div>;

  return (
    <div className="student-dashboard-container repository-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area documentation-content">
        {renderHeader()}
        <div className="documentation-tools">{renderActionButtons()}</div>
        <div className="documentation-files">{renderFileTable()}</div>
        {renderNotification()}
      </div>
      <ToastContainer />
    </div>
  );
};

export default SDocumentation;
