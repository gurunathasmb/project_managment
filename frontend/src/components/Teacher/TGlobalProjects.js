import React, { useEffect, useState } from 'react';
import Sidebar from './TSidebar';
import Header from './THeader';
import '../../css/TeacherCss/TGlobalProjects.css';

function TGlobalProjects() {
  const [projects, setProjects] = useState([]);
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGlobalProjects();
    // eslint-disable-next-line
  }, []);

  const fetchGlobalProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const query = semester ? `?semester=${semester}` : '';

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/teacher/global-projects${query}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      if (data.success) {
        setProjects(data.projects || []);
      } else {
        setError(data.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Header />

        <div className="dashboard-content">
          <h2>All Student Projects</h2>

          {/* 🔽 Semester Filter */}
          <div style={{ marginBottom: '16px' }}>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="">All Semesters</option>
              <option value="1">1st Semester</option>
              <option value="2">2nd Semester</option>
              <option value="3">3rd Semester</option>
              <option value="4">4th Semester</option>
              <option value="5">5th Semester</option>
              <option value="6">6th Semester</option>
              <option value="7">7th Semester</option>
              <option value="8">8th Semester</option>
            </select>

            <button
              onClick={fetchGlobalProjects}
              style={{ marginLeft: '10px' }}
            >
              Apply Filter
            </button>
          </div>

          {loading && <p>Loading...</p>}
          {error && <p className="error-message">{error}</p>}

          {!loading && !error && (
            <table className="global-projects-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Team</th>
                  <th>Student</th>
                  <th>Semester</th>
                  <th>Phase</th>
                
                  <th>Guide</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>
                      No records found
                    </td>
                  </tr>
                ) : (
                  projects.map((p, index) => (
                    <tr key={`${p.studentId}-${index}`}>
                      <td>{p.projectTitle}</td>
                      <td>{p.teamName}</td>
                      <td>{p.studentName}</td>
                      <td>{p.semester}</td>
                      <td>{p.currentPhase}</td>
                      
                      <td>{p.teacherName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default TGlobalProjects;