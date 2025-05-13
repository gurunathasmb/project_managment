import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleSuccess } from '../../utils';
import Sidebar from './TSidebar';
import '../../css/TeacherCss/tProfile.css';

const TProfile = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      setLoggedInUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('User Loggedout');
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="teacher-dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <h1>Welcome, {loggedInUser?.name}</h1>
        <h2>Profile</h2>
      </div>
      <ToastContainer />
    </div>
  );
};

export default TProfile;