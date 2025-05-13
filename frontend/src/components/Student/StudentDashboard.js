import React, { useEffect, useState } from 'react';
import Sidebar from './SSidebar';
import Header from './SHeader';
import { useNavigate } from 'react-router-dom';
import { handleSuccess } from '../../utils';
import '../../css/StudentCss/StudentDashboard.css';

function StudentDashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMember, setNewMember] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [teacherSearchResults, setTeacherSearchResults] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (storedUser) setUser(storedUser);

    fetchStudentData();
    fetchAvailableTeachers();
    fetchAllMembers();
    fetchTeamInfo();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load student data');
      const data = await response.json();
      const user = data.user;
      setUser(user);
      localStorage.setItem('loggedInUser', JSON.stringify(user));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTeamInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/student/team', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 404) return setHasTeam(false);
      if (!response.ok) throw new Error('Failed to load team info');

      const data = await response.json();
      const team = data.team;

      setTeamName(team.teamName);
      setTeamMembers(team.teamMembers.map(m => m.name));
      setAssignedTeachers([team.assignedTeacher]);
      setHasTeam(true);
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/student/teacher', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch teachers');
      const data = await response.json();
      setAvailableTeachers(data.teachers);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/student/members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setAllMembers(data.members);
    } catch (error) {
      console.error(error);
    }
  };

  const saveTeamData = async () => {
    if (!teamName || teamMembers.length === 0 || assignedTeachers.length === 0) {
      alert("Please fill out all team fields.");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const memberDetails = teamMembers.map(name => {
        const member = allMembers.find(m => m.name === name);
        return member ? { _id: member._id, name: member.name } : null;
      }).filter(Boolean);

      // Ensure logged-in user is part of the team members if not already
      if (!teamMembers.includes(user.name)) {
        memberDetails.push({ _id: user._id, name: user.name });
      }

      const assignedTeacherObj = assignedTeachers[0];
      const teacherDetails = typeof assignedTeacherObj === 'object'
        ? { _id: assignedTeacherObj._id, name: assignedTeacherObj.name }
        : availableTeachers.find(t => t.name === assignedTeacherObj);

      if (!teacherDetails) throw new Error("Selected teacher not found");

      const response = await fetch('http://localhost:8000/api/student/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamName,
          teamMembers: memberDetails,
          assignedTeacher: teacherDetails,
          createdBy: user._id, // Pass the user ID here
        }),
      });

      if (!response.ok) throw new Error('Failed to save team data');

      await fetchTeamInfo();
      setHasTeam(true);
      setShowTeamForm(false);
      setNewMember('');
      setNewTeacher('');
      setSearchResults([]);
      setTeacherSearchResults([]);
      alert('Team saved successfully!');
    } catch (error) {
      console.error('Failed to save team data:', error);
      alert('Failed to save team data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTeamMember = () => {
    const memberObj = allMembers.find(m => m.name.toLowerCase() === newMember.toLowerCase());
    if (!newMember.trim()) return;
    if (!memberObj) return alert("Member not found.");
    if (memberObj.teamName) return alert(`${memberObj.name} is already in a team.`);
    if (!teamMembers.includes(newMember)) {
      setTeamMembers([...teamMembers, newMember]);
      setNewMember('');
    }
  };

  const removeTeamMember = (member) => {
    setTeamMembers(teamMembers.filter(m => m !== member));
  };

  const handleSearchMember = (input) => {
    setNewMember(input);
    if (!input.trim()) return setSearchResults([]);
    const filtered = allMembers.filter(m =>
      m.name.toLowerCase().includes(input.toLowerCase()) &&
      !teamMembers.includes(m.name) &&
      !m.teamName
    );
    setSearchResults(filtered);
  };

  const handleSelectMember = (name) => {
    setNewMember(name);
    setSearchResults([]);
  };

  const handleSearchTeacher = (input) => {
    setNewTeacher(input);
    if (!input.trim()) return setTeacherSearchResults([]);
    setTeacherSearchResults(availableTeachers.filter(t =>
      t.name.toLowerCase().includes(input.toLowerCase()) &&
      !assignedTeachers.some(a => (typeof a === 'object' ? a._id : a) === (t._id || t.name))
    ));
  };

  const handleSelectTeacher = (teacher) => {
    setNewTeacher(teacher.name);
    setTeacherSearchResults([]);
  };

  const addTeacher = () => {
    if (!newTeacher.trim()) return;
    const foundTeacher = availableTeachers.find(t => t.name.toLowerCase() === newTeacher.toLowerCase());
    if (foundTeacher && !assignedTeachers.some(a => (typeof a === 'object' && a._id === foundTeacher._id) || a === foundTeacher.name)) {
      setAssignedTeachers([foundTeacher]);
    }
    setNewTeacher('');
  };

  const removeTeacher = () => {
    setAssignedTeachers([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('User Logged out');
    setTimeout(() => navigate('/login'), 1000);
  };

  const canSaveTeam = () => teamName && teamMembers.length > 0 && assignedTeachers.length > 0 && !isSubmitting;

  if (!user) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="main-content">
        <Header user={user} />
        <div className="dashboard-content">
          <div className="welcome-box">
            <h2>Welcome Back, {user.name}</h2>
          </div>
          <div className="team-section">
            {hasTeam ? (
              <div className="team-info">
                <h2>Your Team</h2>
                <div className="team-details">
                  <div className="team-name-display">
                    <h3>Team Name: {teamName}</h3>
                    <button className="edit-button" onClick={() => setShowTeamForm(true)}>Edit Team</button>
                  </div>
                  <div className="team-members-list">
                    <h4>Team Members:</h4>
                    <ul>
                      {teamMembers.map((member, idx) => (
                        <li key={idx}>{member}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="assigned-teacher">
                    <h4>Assigned Teacher:</h4>
                    <ul>
                      {assignedTeachers.map((teacher, idx) => (
                        <li key={idx}>{typeof teacher === 'object' ? teacher.name : teacher}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="create-team">
                <h2>Create Your Team</h2>
                <button className="create-team-button" onClick={() => setShowTeamForm(true)}>Set Up Your Team</button>
              </div>
            )}
            {showTeamForm && (
              <div className="team-form-overlay">
                <div className="team-form">
                  <h2>{hasTeam ? 'Edit Team' : 'Create Team'}</h2>
                  <div className="form-group">
                    <label>Team Name</label>
                    <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter team name" />
                  </div>
                  <div className="form-group">
                    <label>Team Members</label>
                    <div className="add-member">
                      <input type="text" value={newMember} onChange={(e) => handleSearchMember(e.target.value)} placeholder="Search and add team member" />
                      <button onClick={addTeamMember}>Add</button>
                    </div>
                    {searchResults.length > 0 && (
                      <ul className="search-suggestions">
                        {searchResults.map(user => (
                          <li key={user._id} onClick={() => handleSelectMember(user.name)}>
                            {user.name} ({user.email || "Student"})
                          </li>
                        ))}
                      </ul>
                    )}
                    <ul className="members-list">
                      {teamMembers.map((member, idx) => (
                        <li key={idx}>{member} <button className="remove-member" onClick={() => removeTeamMember(member)}>×</button></li>
                      ))}
                    </ul>
                  </div>
                  <div className="form-group">
                    <label>Assigned Teacher</label>
                    <div className="add-teacher">
                      <input type="text" value={newTeacher} onChange={(e) => handleSearchTeacher(e.target.value)} placeholder="Search and assign teacher" />
                      <button onClick={addTeacher}>Assign</button>
                    </div>
                    {teacherSearchResults.length > 0 && (
                      <ul className="search-suggestions">
                        {teacherSearchResults.map(teacher => (
                          <li key={teacher._id} onClick={() => handleSelectTeacher(teacher)}>
                            {teacher.name} ({teacher.email || teacher.subject || 'Teacher'})
                          </li>
                        ))}
                      </ul>
                    )}
                    <ul className="teachers-list">
                      {assignedTeachers.map((teacher, idx) => (
                        <li key={idx}>{typeof teacher === 'object' ? teacher.name : teacher} <button className="remove-teacher" onClick={removeTeacher}>×</button></li>
                      ))}
                    </ul>
                  </div>
                  <div className="form-actions">
                    <button className="cancel-button" onClick={() => setShowTeamForm(false)}>Cancel</button>
                    <button className="save-button" onClick={saveTeamData} disabled={!canSaveTeam()}>Save Team</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
