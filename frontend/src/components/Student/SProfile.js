import React, { useEffect, useState } from 'react';
import Sidebar from './SSidebar';
import { handleSuccess, handleError } from '../../utils';
import '../../css/StudentCss/sProfile.css';

const SProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    semester: '',
    phone: '',
    usn: '',
    skills: ''
  });

  // Fetch profile
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/student/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          department: data.user.department || '',
          semester: data.user.semester || '',
          phone: data.user.phone || '',
          usn: data.user.usn || '',
          skills: data.user.skills || ''
        });
      })
      .catch(() => handleError('Failed to load profile'));
  }, [token]);

  // Handle save
  const handleSave = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/student/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (result.success) {
        setUser(result.user);
        setIsEditing(false);
        handleSuccess('Profile updated successfully');
      } else {
        handleError(result.message);
      }
    } catch {
      handleError('Update failed');
    }
  };

  if (!user) return null;

  return (
    <div className="student-dashboard-container">
      <Sidebar />
      <div className="content-area">
        <h1>My Profile</h1>

        {/* ================= VIEW MODE ================= */}
        {!isEditing && (
          <div className="profile-card">
            <div className="profile-row"><span>Name</span><p>{user.name}</p></div>
            <div className="profile-row"><span>Email</span><p>{user.email}</p></div>
            <div className="profile-row"><span>Department</span><p>{user.department || '-'}</p></div>
            <div className="profile-row"><span>Semester</span><p>{user.semester || '-'}</p></div>
            <div className="profile-row"><span>Phone</span><p>{user.phone || '-'}</p></div>
            <div className="profile-row"><span>USN</span><p>{user.usn || '-'}</p></div>
            <div className="profile-row"><span>Skills</span><p>{user.skills || '-'}</p></div>

            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>
        )}

        {/* ================= EDIT MODE ================= */}
        {isEditing && (
          <div className="profile-form">
            {Object.keys(formData).map(key => (
              <div className="form-group" key={key}>
                <label>{key.toUpperCase()}</label>
                <input
                  value={formData[key]}
                  onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                />
              </div>
            ))}

            <div className="profile-actions">
              <button className="save-btn" onClick={handleSave}>Save</button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SProfile;
