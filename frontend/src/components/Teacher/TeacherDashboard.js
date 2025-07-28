import React, { useEffect, useState } from 'react';
import Sidebar from './TSidebar';
import Header from './THeader';
import '../../css/TeacherCss/TeacherDashboard.css';

function TeacherDashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [assignedStudentTeams, setAssignedStudentTeams] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const token = localStorage.getItem('token');

    if (loggedInUser && token) {
      const parsedUser = JSON.parse(loggedInUser);
      setUser(parsedUser);
      fetchAssignedStudentTeams(token);
    }
  }, []);

  const fetchAssignedStudentTeams = async (token) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/teacher/teams', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setAssignedStudentTeams(data.teams);
      } else {
        setError('Failed to fetch assigned teams.');
      }
    } catch (error) {
      setError('Error fetching assigned teams. Please try again later.');
      console.error('Error fetching assigned teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandTeam = (index) => {
    setExpandedTeam(expandedTeam === index ? null : index);
  };

  const handleContactTeam = (teamId) => {
    // Navigate to discussions or messaging interface
    window.location.href = `/teacher/discussions?teamId=${teamId}`;
  };

  const handleViewProgress = (teamId) => {
    // Navigate to team progress page
    window.location.href = `/teacher/project-status?teamId=${teamId}`;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar onLogout={onLogout} />
        <div className="main-content">
          <Header user={user} />
          <div className="dashboard-content">
            <div className="loading-spinner">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <Header user={user} />
        <div className="dashboard-content">
          <div className="welcome-box">
            <h2>Welcome Back, {user?.name || 'Teacher'}</h2>
            <p>You have {assignedStudentTeams.length} team{assignedStudentTeams.length !== 1 ? 's' : ''} assigned to you.</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="assigned-teams-section">
            <h2>Student Teams Assigned to You</h2>

            {assignedStudentTeams.length === 0 ? (
              <div className="no-teams-message">
                <p>No student teams have assigned you as their teacher yet.</p>
                <p>Once students create teams and select you as their teacher, they will appear here.</p>
              </div>
            ) : (
              <div className="student-teams-list">
                {assignedStudentTeams.map((team, index) => (
                  <div className="student-team-card" key={team._id}>
                    <div 
                      className={`team-card-header ${expandedTeam === index ? 'expanded' : ''}`} 
                      onClick={() => toggleExpandTeam(index)}
                    >
                      <div className="team-header-info">
                        <h3>{team.teamName}</h3>
                        <span className="team-member-count">
                          {team.teamMembers.length} member{team.teamMembers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="expand-icon">
                        {expandedTeam === index ? '▼' : '►'}
                      </span>
                    </div>

                    {expandedTeam === index && (
                      <div className="team-card-details">
                        <div className="team-members">
                          <h4>Team Members:</h4>
                          <ul>
                            {team.teamMembers.map((member) => (
                              <li key={member._id}>
                                <span className="member-name">{member.name}</span>
                                <span className="member-email">{member.email}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="team-info-grid">
                          <div className="team-info-item">
                            <h4>Created On:</h4>
                            <p>{new Date(team.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="team-info-item">
                            <h4>Team Lead:</h4>
                            <p>{team.teamMembers.find(m => m._id === team.createdBy)?.name || 'Not specified'}</p>
                          </div>
                        </div>
                        <div className="team-actions">
                          <button 
                            className="contact-team-button"
                            onClick={() => handleContactTeam(team._id)}
                          >
                            Contact Team
                          </button>
                          <button 
                            className="view-progress-button"
                            onClick={() => handleViewProgress(team._id)}
                          >
                            View Progress
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="updates-section">
            <h2>Recent Updates</h2>
            <div className="update-cards">
              <div className="update-card">
                <h3>Team Assignments</h3>
                <p>{assignedStudentTeams.length} teams have selected you as their teacher.</p>
              </div>
              <div className="update-card">
                <h3>Recent Activity</h3>
                <p>
                  {assignedStudentTeams.length > 0 
                    ? `Latest team joined: ${assignedStudentTeams[assignedStudentTeams.length - 1]?.teamName}`
                    : 'No recent team assignments.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
