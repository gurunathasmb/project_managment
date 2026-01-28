import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../utils';
import '../../css/TeacherCss/tSidebar.css';

// Icons
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z" />
  </svg>
);

const FundsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const DocIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </svg>
);

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingProject, setLoadingProject] = useState(false);

  const isActivePath = (path) => location.pathname === path;

  const openProjectStatus = async () => {
    try {
      setLoadingProject(true);
      const token = localStorage.getItem('token');

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success && data.teams?.length > 0) {
        navigate(`/teacher/project-status?teamId=${data.teams[0]._id}`);
      } else {
        navigate('/teacher/project-status');
      }
    } catch {
      navigate('/teacher/project-status');
    } finally {
      setLoadingProject(false);
    }
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-container">
          <div className="logo-icon">P</div>
          <h2 className="logo-text">Planova</h2>
        </div>
      </div>

      <div className="nav-menu">
        <Link to="/teacher/dashboard" className={`nav-item ${isActivePath('/teacher/dashboard') ? 'active' : ''}`}>
          <span className="icon"><HomeIcon /></span>
          <span className="text">Dashboard</span>
        </Link>

        <Link to="/teacher/global-projects" className={`nav-item ${isActivePath('/teacher/global-projects') ? 'active' : ''}`}>
          <span className="icon"><GlobeIcon /></span>
          <span className="text">Global Projects</span>
        </Link>

        <button className="nav-item nav-btn" onClick={openProjectStatus} disabled={loadingProject}>
          <span className="icon"><ChartIcon /></span>
          <span className="text">{loadingProject ? 'Loading...' : 'Project Status'}</span>
        </button>

        <Link to="/teacher/funds" className="nav-item">
          <span className="icon"><FundsIcon /></span>
          <span className="text">Funds</span>
        </Link>

        <Link to="/teacher/documentation" className="nav-item">
          <span className="icon"><DocIcon /></span>
          <span className="text">Documentation</span>
        </Link>

        <Link to="/teacher/profile" className="nav-item">
          <span className="icon"><ProfileIcon /></span>
          <span className="text">Profile</span>
        </Link>
      </div>

      <div className="sidebar-footer">
        <button className="nav-item logout-button" onClick={() => logout(navigate)}>
          <span className="icon"><LogoutIcon /></span>
          <span className="text">Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;