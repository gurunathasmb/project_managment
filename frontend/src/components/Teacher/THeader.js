import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../../css/TeacherCss/tHeader.css'; // Adjust the path as necessary

function THeader({ user }) {
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Determine the title based on current route
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

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // External tool links
  const handleExternalLink = (url) => {
    window.open(url, '_blank');
  };

  // Fallback values if user is not loaded yet
  const userName = user?.name || 'Teacher';
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'T';

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
          <div 
            className="avatar"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {userInitial}
          </div>
          
          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <h3>{userName}</h3>
              </div>
              <div className="dropdown-item" onClick={() => console.log('About clicked')}>
                <span>About</span>
              </div>
              <div className="dropdown-item" onClick={() => console.log('Settings clicked')}>
                <span>Settings</span>
              </div>
              <div className="dropdown-item logout" onClick={() => console.log('Logout clicked')}>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default THeader;
