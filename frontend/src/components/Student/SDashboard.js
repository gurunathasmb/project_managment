import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './SSidebar';

const SDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('loggedInUser'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  };

  return (
    <div className="student-dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <h1>Welcome Back, {user?.name}</h1>
        <div className="create-team-section">
          <h2>Create Your Team</h2>
          <button className="setup-team-button" onClick={() => navigate('/student/create-team')}>
            Set Up Your Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default SDashboard; 