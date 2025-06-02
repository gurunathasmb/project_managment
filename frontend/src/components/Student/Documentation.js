import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './SSidebar';
import '../../css/StudentCss/documentation.css';

const Documentation = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchDocuments();
    fetchTeachers();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/student/documentation', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDocuments(data.docs);
      }
    } catch (error) {
      handleError('Failed to fetch documents');
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/student/teacher', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTeachers(data.teachers);
      }
    } catch (error) {
      handleError('Failed to fetch teachers');
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedTeacher) {
      handleError('Please select both a file and a teacher');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('teacherId', selectedTeacher);

    try {
      const response = await fetch('http://localhost:8000/api/student/documentation/upload', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`
          // Remove Content-Type header - let browser set it with boundary for multipart/form-data
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        handleSuccess('Document uploaded successfully');
        setSelectedFile(null);
        setSelectedTeacher('');
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        fetchDocuments(); // Refresh the documents list
      } else {
        handleError(data.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      handleError('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
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

  return (
    <div className="student-dashboard-container">
      <Sidebar />
      <div className="content-area">
        <h1>Documentation</h1>
        
        <div className="upload-section">
          <div className="shared-info">
            <p>Your documents are shared with: {teachers.find(t => t._id === selectedTeacher)?.name || 'Select a teacher'}</p>
          </div>

          <div className="upload-controls">
            <div className="form-group">
              <label>Select Teacher</label>
              <select 
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="teacher-select"
              >
                <option value="">-- Select Teacher --</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Choose File</label>
              <input
                type="file"
                onChange={handleFileSelect}
                className="file-input"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
            </div>

            <button 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFile || !selectedTeacher}
              className="upload-button"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        <div className="documents-section">
          <h2>Uploaded Documents</h2>
          <div className="documents-list">
            <div className="documents-header">
              <span>Name</span>
              <span>Type</span>
              <span>Date Modified</span>
              <span>Shared With</span>
            </div>
            {documents.length === 0 ? (
              <div className="no-documents">
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc._id} className="document-item">
                  <span className="document-name">
                    {getFileIcon(doc.fileType)} {doc.fileName}
                  </span>
                  <span className="document-type">{doc.fileType}</span>
                  <span className="document-date">{formatDate(doc.createdAt)}</span>
                  <span className="document-shared">
                    {doc.sharedWithTeachers.map(teacher => teacher.name).join(', ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Documentation; 