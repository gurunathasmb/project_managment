import React, { useEffect, useState } from 'react';
import Sidebar from './TSidebar';
import Header from './THeader';
import '../../css/TeacherCss/TeacherDashboard.css';

function TeacherDashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [assignedStudentTeams, setAssignedStudentTeams] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);

  // Load user data and fetch assigned student teams from backend
  useEffect(() => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const token = localStorage.getItem('token');

    if (loggedInUser && token) {
      const parsedUser = JSON.parse(loggedInUser);
      setUser(parsedUser);
      fetchAssignedStudentTeams(token);
    }
  }, []);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  // Fetch teams assigned to the current teacher from backend
  const fetchAssignedStudentTeams = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/teacher/teams`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setAssignedStudentTeams(data.teams);
      } else {
        console.error('Failed to fetch assigned teams.');
      }
    } catch (error) {
      console.error('Error fetching assigned teams:', error);
    }
  };

  const toggleExpandTeam = (index) => {
    setExpandedTeam(expandedTeam === index ? null : index);
  };

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={onLogout} />

      <div className="main-content">
        <Header user={user} />

        <div className="dashboard-content">
          <div className="welcome-box">
            <h2>Welcome Back, {user?.name || 'Teacher'}</h2>
          </div>

          {/* Assigned Teams Section */}
          <div className="assigned-teams-section">
            <h2>Student Teams Assigned to You</h2>

            {assignedStudentTeams.length === 0 ? (
              <div className="no-teams-message">
                <p>No student teams have assigned you as their teacher yet.</p>
              </div>
            ) : (
              <div className="student-teams-list">
                {assignedStudentTeams.map((team, index) => (
                  <div className="student-team-card" key={team._id}>
                    <div className="team-card-header" onClick={() => toggleExpandTeam(index)}>
                      <h3>{team.teamName}</h3>
                      <span className="expand-icon">
                        {expandedTeam === index ? '▼' : '►'}
                      </span>
                    </div>

                    {expandedTeam === index && (
                      <div className="team-card-details">
                        <div className="team-members">
                          <h4>Team Members:</h4>
                          <ul>
                            {team.teamMembers.map((member, memberIndex) => (
                              <li key={member._id}>
                                {member.name} ({member.email})
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="team-actions">
                          <button className="contact-team-button">Contact Team</button>
                          <button className="view-progress-button">View Progress</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Updates Section */}
          <div className="updates-section">
            <h2>Recent Updates</h2>
            <div className="update-cards">
              <div className="update-card">
                <h3>Team Assignments</h3>
                <p>{assignedStudentTeams.length} teams have selected you as their teacher.</p>
              </div>
              <div className="update-card">
                <h3>Pending Reviews</h3>
                <p>No pending reviews at this time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
