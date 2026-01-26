import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './SSidebar';
import '../../css/StudentCss/sProjectStatus.css';

const SProjectStatus = () => {
  const token = localStorage.getItem('token');

  const [team, setTeam] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [workspace, setWorkspace] = useState(null);
  const [viewMode, setViewMode] = useState(true); // ✅ NEW

  const [workspaceForm, setWorkspaceForm] = useState({
    title: '',
    domain: '',
    techStackText: '',
    description: '',
    currentPhase: 'Idea',
    problemStatement: '',
    objectivesText: '',
    repoUrl: '',
    demoUrl: '',
    startDate: '',
    endDate: ''
  });

  const [teachers, setTeachers] = useState([]);
  const [updates, setUpdates] = useState([]);

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const setField = (key, value) => {
    setWorkspaceForm(prev => ({ ...prev, [key]: value }));
  };

  /* ================= FETCH WORKSPACE ================= */
  const fetchWorkspace = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/student/workspace`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.success) {
        setTeam(null);
        setWorkspace(null);
        setIsLeader(false);
        setViewMode(true);
        return;
      }

      setTeam(data.team);
      setIsLeader(!!data.isLeader);
      setWorkspace(data.project || null);

      // ✅ if project exists => show view mode by default
      setViewMode(true);

      const p = data.project;
      if (p) {
        setWorkspaceForm({
          title: p.title || '',
          domain: p.domain || '',
          techStackText: Array.isArray(p.techStack) ? p.techStack.join(', ') : '',
          description: p.description || '',
          currentPhase: p.currentPhase || 'Idea',
          problemStatement: p.problemStatement || '',
          objectivesText: Array.isArray(p.objectives) ? p.objectives.join('\n') : '',
          repoUrl: p.repoUrl || '',
          demoUrl: p.demoUrl || '',
          startDate: p.startDate ? String(p.startDate).slice(0, 10) : '',
          endDate: p.endDate ? String(p.endDate).slice(0, 10) : ''
        });
      }

      const assignedTeacherId =
        data.team?.assignedTeacher?._id || data.team?.assignedTeacher || '';
      if (assignedTeacherId) setSelectedTeacherId(assignedTeacherId);
    } catch (e) {
      handleError('Failed to load workspace');
    }
  };

  /* ================= FETCH TEACHERS ================= */
  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/student/teacher`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setTeachers(data.teachers);
    } catch {
      handleError('Failed to load teachers');
    }
  };

  /* ================= FETCH UPDATES ================= */
  const fetchUpdates = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/student/project-updates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUpdates(data.updates);
    } catch {
      handleError('Failed to load updates');
    }
  };

  useEffect(() => {
    fetchWorkspace();
    fetchTeachers();
    fetchUpdates();
    // eslint-disable-next-line
  }, []);

  /* ================= SAVE WORKSPACE ================= */
  const saveWorkspace = async () => {
    if (!isLeader) return handleError('Only team leader can edit workspace');
    if (!workspaceForm.title.trim()) return handleError('Project title is required');

    const techStack = workspaceForm.techStackText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const objectives = workspaceForm.objectivesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/student/workspace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: workspaceForm.title,
          domain: workspaceForm.domain,
          techStack,
          description: workspaceForm.description,
          currentPhase: workspaceForm.currentPhase,
          problemStatement: workspaceForm.problemStatement,
          objectives,
          repoUrl: workspaceForm.repoUrl,
          demoUrl: workspaceForm.demoUrl,
          startDate: workspaceForm.startDate || null,
          endDate: workspaceForm.endDate || null,
          milestones: workspace?.milestones || []
        })
      });

      const data = await res.json();
      if (data.success) {
        handleSuccess('Workspace saved');
        setWorkspace(data.project);
        setViewMode(true); // ✅ switch to stagnant view
        fetchWorkspace();
      } else {
        handleError(data.message || 'Failed to save workspace');
      }
    } catch {
      handleError('Failed to save workspace');
    }
  };

  /* ================= SEND STATUS UPDATE ================= */
  const sendStatusUpdate = async () => {
    if (!selectedTeacherId || !statusMessage.trim()) {
      return handleError('Select teacher & write update');
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/student/send-status-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        teacherId: selectedTeacherId,
        projectName: workspace?.title || workspaceForm.title || 'Not specified',
        message: statusMessage
      })
    });

    const data = await res.json();
    if (data.success) {
      handleSuccess('Update sent');
      setStatusMessage('');
      fetchUpdates();
    } else {
      handleError(data.message || 'Failed to send update');
    }
  };

  return (
    <div className="student-dashboard-container">
      <Sidebar />
      <div className="content-area">
        <h1>Project Management</h1>

        {team && (
          <div className="status-update-section">
            <h2>Team</h2>
            <div className="profile-row"><span>Team Name</span><p>{team.teamName}</p></div>
            <div className="profile-row"><span>Guide Teacher</span><p>{team.assignedTeacher?.name || 'Not assigned'}</p></div>
            <div className="profile-row">
              <span>Your Access</span>
              <p>{isLeader ? 'Team Leader' : 'Member'}</p>
            </div>
          </div>
        )}

        {/* ================= WORKSPACE ================= */}
        <div className="status-update-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Project Workspace</h2>

            {/* ✅ buttons */}
            {isLeader && workspace && viewMode && (
              <button className="submit-button" onClick={() => setViewMode(false)}>
                Edit Workspace
              </button>
            )}
          </div>

          {/* ✅ VIEW MODE (stagnant) */}
          {viewMode && workspace ? (
            <div>
              <div className="profile-row"><span>Title</span><p>{workspace.title}</p></div>
              <div className="profile-row"><span>Domain</span><p>{workspace.domain || '—'}</p></div>
              <div className="profile-row"><span>Tech Stack</span><p>{workspace.techStack?.join(', ') || '—'}</p></div>
              <div className="profile-row"><span>Phase</span><p>{workspace.currentPhase || '—'}</p></div>
              <div className="profile-row"><span>Description</span><p>{workspace.description || '—'}</p></div>
              <div className="profile-row"><span>Problem Statement</span><p>{workspace.problemStatement || '—'}</p></div>
              <div className="profile-row"><span>Objectives</span><p>{workspace.objectives?.length ? workspace.objectives.join(' | ') : '—'}</p></div>
              <div className="profile-row"><span>Repo URL</span><p>{workspace.repoUrl || '—'}</p></div>
              <div className="profile-row"><span>Demo URL</span><p>{workspace.demoUrl || '—'}</p></div>
              <div className="profile-row">
                <span>Timeline</span>
                <p>
                  {(workspace.startDate ? String(workspace.startDate).slice(0, 10) : '—')}
                  {'  to  '}
                  {(workspace.endDate ? String(workspace.endDate).slice(0, 10) : '—')}
                </p>
              </div>
            </div>
          ) : (
            /* ✅ EDIT MODE (form) */
            <div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  value={workspaceForm.title}
                  onChange={(e) => setField('title', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              <div className="form-group">
                <label>Domain</label>
                <input
                  value={workspaceForm.domain}
                  onChange={(e) => setField('domain', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              <div className="form-group">
                <label>Tech Stack (comma separated)</label>
                <input
                  value={workspaceForm.techStackText}
                  onChange={(e) => setField('techStackText', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              <div className="form-group">
                <label>Current Phase</label>
                <select
                  value={workspaceForm.currentPhase}
                  onChange={(e) => setField('currentPhase', e.target.value)}
                  disabled={!isLeader}
                >
                  <option value="Idea">Idea</option>
                  <option value="Design">Design</option>
                  <option value="Development">Development</option>
                  <option value="Testing">Testing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={workspaceForm.description}
                  onChange={(e) => setField('description', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              <div className="form-group">
                <label>Problem Statement</label>
                <textarea
                  rows={3}
                  value={workspaceForm.problemStatement}
                  onChange={(e) => setField('problemStatement', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              <div className="form-group">
                <label>Objectives (one per line)</label>
                <textarea
                  rows={4}
                  value={workspaceForm.objectivesText}
                  onChange={(e) => setField('objectivesText', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              <div className="form-group">
                <label>Repo URL</label>
                <input
                  value={workspaceForm.repoUrl}
                  onChange={(e) => setField('repoUrl', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              <div className="form-group">
                <label>Demo URL</label>
                <input
                  value={workspaceForm.demoUrl}
                  onChange={(e) => setField('demoUrl', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={workspaceForm.startDate}
                  onChange={(e) => setField('startDate', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={workspaceForm.endDate}
                  onChange={(e) => setField('endDate', e.target.value)}
                  disabled={!isLeader}
                />
              </div>

              {isLeader && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="submit-button" onClick={saveWorkspace}>
                    Save Workspace
                  </button>
                  {workspace && (
                    <button className="submit-button" onClick={() => setViewMode(true)}>
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {!workspace && viewMode && (
            <p style={{ marginTop: '10px' }}>
              No workspace saved yet. {isLeader ? 'Click edit and save.' : 'Ask team leader to fill it.'}
            </p>
          )}
        </div>

        {/* ================= SEND UPDATE ================= */}
        <div className="status-update-section">
          <h2>Send Status Update</h2>

          <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
            <option value="">Select Teacher</option>
            {teachers.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          <textarea
            rows={4}
            placeholder="Describe your progress..."
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
          />

          <button className="submit-button" onClick={sendStatusUpdate}>
            Send Update
          </button>
        </div>

        {/* ================= TEACHER COMMENTS ================= */}
        <div className="updates-history-section">
          <h2>Teacher Feedback</h2>

          {updates.length === 0 ? (
            <p>No updates yet</p>
          ) : (
            updates.map(update => (
              <div key={update._id} className="update-item">
                <p><strong>Message:</strong> {update.message}</p>
                <p><strong>Teacher:</strong> {update.teacherId?.name}</p>

                {update.comments?.length > 0 && (
                  <div className="teacher-comments">
                    <h4>Comments</h4>
                    {update.comments.map((c, i) => (
                      <div key={i} className="comment-item">
                        <strong>{c.sender === 'teacher' ? 'Teacher' : 'You'}</strong>
                        <p>{c.text}</p>
                        <small>{new Date(c.timestamp).toLocaleString()}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default SProjectStatus;
