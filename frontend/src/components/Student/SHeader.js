import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../css/StudentCss/sHeader.css';

function SHeader({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const getTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/projects':
        return 'Project List';
      case '/status':
        return 'Project Status';
      case '/documentation':
        return 'Documentation';
      case '/funds':
        return 'Funds';
      case '/discussionpage':
        return 'Real-time Discussion';
      default:
        return 'Dashboard';
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExternalLink = (url) => {
    window.open(url, '_blank');
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('loggedInUser');
      navigate('/'); // Redirect to landing page
    }
  };

  return (
    <div className="header">
      <h1>{getTitle()}</h1>

      <div className="header-tools">
        <div className="external-tools">
          <div className="tool-icon" onClick={() => handleExternalLink('https://chat.openai.com')}>
            <span title="ChatGPT">🤖</span>
          </div>
          <div className="tool-icon" onClick={() => handleExternalLink('https://claude.ai')}>
            <span title="Claude">🧠</span>
          </div>
          <div className="tool-icon" onClick={() => handleExternalLink('https://github.com')}>
            <span title="GitHub">🐙</span>
          </div>
        </div>

        <div className="user-info" ref={dropdownRef}>
          <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
            {user.name.charAt(0)}
          </div>

          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <h3>{user.name}</h3>
              </div>
              <div className="dropdown-item">
                <span>About</span>
              </div>
              <div className="dropdown-item">
                <span>Settings</span>
              </div>
              <div className="dropdown-item logout" onClick={handleLogout}>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SHeader;
