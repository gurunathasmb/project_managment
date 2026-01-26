import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import Sidebar from './TSidebar';
import { handleSuccess, handleError } from '../../utils';
import '../../css/TeacherCss/tProfile.css';

const TProfile = () => {
  const token = localStorage.getItem('token');

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
    skills: '',
    designation: '',
    employeeId: ''
  });

  /* ================= FETCH TEACHER PROFILE ================= */
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setUser(data.user);

        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          department: data.user.department || '',
          phone: data.user.phone || '',
          skills: data.user.skills || '',
          designation: data.user.designation || '',
          employeeId: data.user.employeeId || ''
        });
      } else {
        handleError(data.message || 'Failed to load profile');
      }
    } catch (e) {
      handleError('Failed to load profile');
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  /* ================= SAVE PROFILE ================= */
  const handleSave = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/teacher/profile/update-info`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      const result = await res.json();
      if (result.success) {
        setUser(result.user);
        setIsEditing(false);

        // ✅ Update localStorage so teacher name etc becomes stagnant everywhere
        localStorage.setItem('loggedInUser', JSON.stringify(result.user));

        handleSuccess('Profile updated successfully');
      } else {
        handleError(result.message || 'Update failed');
      }
    } catch (e) {
      handleError('Update failed');
    }
  };

  if (!user) return null;

  return (
    <div className="teacher-dashboard-container">
      <Sidebar />
      <div className="content-area">
        <h1>My Profile</h1>

        {/* ================= VIEW MODE ================= */}
        {!isEditing && (
          <div className="profile-card">
            <div className="profile-row"><span>Name</span><p>{user.name}</p></div>
            <div className="profile-row"><span>Email</span><p>{user.email}</p></div>
            <div className="profile-row"><span>Department</span><p>{user.department || '-'}</p></div>
            <div className="profile-row"><span>Phone</span><p>{user.phone || '-'}</p></div>
            <div className="profile-row"><span>Designation</span><p>{user.designation || '-'}</p></div>
            <div className="profile-row"><span>Employee ID</span><p>{user.employeeId || '-'}</p></div>
            <div className="profile-row"><span>Skills</span><p>{user.skills || '-'}</p></div>

            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </div>
        )}

        {/* ================= EDIT MODE ================= */}
        {isEditing && (
          <div className="profile-form">
            {Object.keys(formData).map((key) => (
              <div className="form-group" key={key}>
                <label>{key.toUpperCase()}</label>
                <input
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                />
              </div>
            ))}

            <div className="profile-actions">
              <button className="save-btn" onClick={handleSave}>Save</button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setIsEditing(false);
                  // reset form back to original user
                  setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    department: user.department || '',
                    phone: user.phone || '',
                    skills: user.skills || '',
                    designation: user.designation || '',
                    employeeId: user.employeeId || ''
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default TProfile;
