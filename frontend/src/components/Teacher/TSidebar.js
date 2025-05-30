import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../css/TeacherCss/tSidebar.css';

// SVG Icons as components
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const FundsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);

const DocIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);



const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);


function Sidebar({ onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-container">
          <div className="logo-icon">P</div>
          <h2 className="logo-text">Planova</h2>
        </div>
      </div>

        <div className="nav-menu">
             <Link to="/teacher/dashboard" className={`nav-item ${isActive('/teacher/dashboard') ? 'active' : ''}`}>
               <span className="icon"><HomeIcon /></span>
               <span className="text">Dashboard</span>
             </Link>

         <Link to="/teacher/project-status" className={`nav-item ${isActive('/teacher/project-status') ? 'active' : ''}`}>
                  <span className="icon"><ChartIcon /></span>
                  <span className="text">Project Status</span>
                </Link>

         <Link to="/teacher/funds" className={`nav-item ${isActive('/teacher/funds') ? 'active' : ''}`}>
                  <span className="icon"><FundsIcon /></span>
                  <span className="text">Funds</span>
                </Link>
        

       
               <Link to="/teacher/documentation" className={`nav-item ${isActive('/teacher/documentation') ? 'active' : ''}`}>
                 <span className="icon"><DocIcon /></span>
                 <span className="text">Documentation</span>
               </Link>

        
             </div>
       
             <div className="sidebar-footer">
        <button className="nav-item logout-button" onClick={onLogout}>
          <span className="icon"><LogoutIcon /></span>
          <span className="text">Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;