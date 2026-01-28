import React, { useEffect, useMemo, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { handleSuccess, handleError } from '../../utils';
import Sidebar from './TSidebar';
import '../../css/TeacherCss/tProjectStatus.css';
import { useLocation, useNavigate } from 'react-router-dom';

const DEFAULT_RUBRIC = [
  { key: 'problem', label: 'Problem Understanding', max: 10 },
  { key: 'method', label: 'Methodology / Approach', max: 10 },
  { key: 'progress', label: 'Implementation / Progress', max: 10 },
  { key: 'docs', label: 'Documentation', max: 10 },
  { key: 'comm', label: 'Communication / Presentation', max: 10 }
];

const TProjectStatus = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ teamId from URL
  const teamId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('teamId');
  }, [location.search]);

  // ✅ assigned teams list (for dropdown)
  const [assignedTeams, setAssignedTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const [teamWorkspace, setTeamWorkspace] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);

  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ✅ Rubric states
  const [phase, setPhase] = useState('phase1'); // phase1 | phase2 | final
  const [rubricRows, setRubricRows] = useState(DEFAULT_RUBRIC.map(r => ({ ...r, score: 0 })));
  const [remarks, setRemarks] = useState('');
  const [rubricLoading, setRubricLoading] = useState(false);
  const [rubricLocked, setRubricLocked] = useState(false);

  // ✅ AI Progress states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState(null);

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const total = rubricRows.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
  const maxTotal = rubricRows.reduce((sum, r) => sum + (Number(r.max) || 0), 0);

  // ✅ Fetch assigned teams for dropdown
  const fetchAssignedTeams = async () => {
    try {
      setTeamsLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setAssignedTeams(data.teams || []);
        return data.teams || [];
      } else {
        setAssignedTeams([]);
        handleError(data.message || 'Failed to fetch teams');
        return [];
      }
    } catch (e) {
      setAssignedTeams([]);
      return [];
    } finally {
      setTeamsLoading(false);
    }
  };

  // ✅ Redirect to first team if teamId missing
  useEffect(() => {
    (async () => {
      const teams = await fetchAssignedTeams();
      if (!teamId && teams.length > 0) {
        navigate(`/teacher/project-status?teamId=${teams[0]._id}`, { replace: true });
      }
    })();
    // eslint-disable-next-line
  }, [teamId]);

  // ✅ Fetch team workspace
  const fetchTeamWorkspace = async (tid) => {
    try {
      setWorkspaceLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/teacher/team-workspace?teamId=${tid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) setTeamWorkspace(data);
      else setTeamWorkspace(null);
    } catch (e) {
      setTeamWorkspace(null);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  // ✅ Fetch rubric for a phase
  const fetchRubric = async (tid, ph) => {
    if (!tid) return;
    try {
      setRubricLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/teacher/rubric-evaluation?teamId=${tid}&phase=${ph}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (data.success && data.evaluation) {
        const saved = data.evaluation;

        const merged = DEFAULT_RUBRIC.map(d => {
          const found = saved.criteria?.find(x => x.key === d.key);
          return {
            ...d,
            score: found ? Number(found.score) : 0,
            max: found ? Number(found.max) : d.max,
            label: found?.label || d.label
          };
        });

        setRubricRows(merged);
        setRemarks(saved.remarks || '');
        setRubricLocked(true);
      } else {
        setRubricRows(DEFAULT_RUBRIC.map(r => ({ ...r, score: 0 })));
        setRemarks('');
        setRubricLocked(false);
      }
    } catch (e) {
      handleError('Failed to load rubric');
    } finally {
      setRubricLoading(false);
    }
  };

  // ✅ AI: fetch saved evaluation for team+phase
  const fetchAIProgress = async (tid, ph) => {
    if (!tid) return;
    try {
      setAiLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/teacher/ai-progress?teamId=${tid}&phase=${ph}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (data.success) setAiEvaluation(data.evaluation || null);
      else setAiEvaluation(null);
    } catch (e) {
      setAiEvaluation(null);
    } finally {
      setAiLoading(false);
    }
  };

  // ✅ AI: run evaluation and save in DB
  const runAIProgress = async () => {
    if (!teamId) return;
    try {
      setAiRunning(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/ai-progress/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teamId, phase })
      });
      const data = await res.json();

      if (data.success) {
        handleSuccess('AI progress generated');
        setAiEvaluation(data.evaluation || null);
      } else {
        handleError(data.message || 'Failed to generate AI progress');
      }
    } catch (e) {
      handleError('Failed to generate AI progress');
    } finally {
      setAiRunning(false);
    }
  };

  // ✅ Load workspace + rubric + AI whenever teamId or phase changes
  useEffect(() => {
    if (!teamId) return;
    fetchTeamWorkspace(teamId);
    fetchRubric(teamId, phase);
    fetchAIProgress(teamId, phase);
    setSelectedUpdate(null);
    setCommentText('');
    // eslint-disable-next-line
  }, [teamId, phase]);

  // ✅ Dropdown team change
  const handleTeamChange = (e) => {
    const newTeamId = e.target.value;
    if (!newTeamId) return;
    navigate(`/teacher/project-status?teamId=${newTeamId}`);
  };

  const handleSelectUpdate = (update) => {
    setSelectedUpdate(update);
    setCommentText('');
  };

  // ✅ Send comment (teacher reply)
  const sendComment = async () => {
    if (!commentText.trim() || !selectedUpdate) return handleError('Please write a comment');

    try {
      setIsSending(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/send-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ updateId: selectedUpdate._id, comment: commentText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        handleSuccess('Comment sent');
        setCommentText('');
        fetchTeamWorkspace(teamId); // ✅ reload to show new comment
      } else handleError(data.message);
    } catch (e) {
      handleError('Failed to send comment');
    } finally {
      setIsSending(false);
    }
  };

  // ✅ rubric input handler (prevents 010, 050)
  const updateScore = (key, raw) => {
    if (raw === '') {
      setRubricRows(prev => prev.map(r => (r.key === key ? { ...r, score: '' } : r)));
      return;
    }

    const num = Number(raw);
    setRubricRows(prev =>
      prev.map(r => {
        if (r.key !== key) return r;
        const max = Number(r.max) || 10;
        let v = Number.isNaN(num) ? 0 : num;
        if (v < 0) v = 0;
        if (v > max) v = max;
        return { ...r, score: v };
      })
    );
  };

  const saveRubric = async () => {
    if (!teamId) return;

    const normalized = rubricRows.map(r => ({
      key: r.key,
      label: r.label,
      max: r.max,
      score: r.score === '' ? 0 : Number(r.score || 0)
    }));

    try {
      setRubricLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/teacher/rubric-evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          teamId,
          phase,
          criteria: normalized,
          remarks
        })
      });

      const data = await res.json();
      if (data.success) {
        handleSuccess('Evaluation saved');
        setRubricLocked(true);
        await fetchRubric(teamId, phase);
      } else {
        handleError(data.message || 'Failed to save evaluation');
      }
    } catch (e) {
      handleError('Failed to save evaluation');
    } finally {
      setRubricLoading(false);
    }
  };

  const switchPhase = (ph) => {
    setPhase(ph);
    setSelectedUpdate(null);
    setCommentText('');
  };

  const renderTeamWorkspace = () => {
    if (workspaceLoading) return <div className="loading-state">Loading workspace...</div>;

    // Team selector always visible
    const headerRow = (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Team Workspace</h2>
        <div style={{ minWidth: 240 }}>
          <select
            value={teamId || ''}
            onChange={handleTeamChange}
            disabled={teamsLoading || assignedTeams.length === 0}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            {assignedTeams.length === 0 ? (
              <option value="">No assigned teams</option>
            ) : (
              assignedTeams.map(t => (
                <option key={t._id} value={t._id}>
                  {t.teamName}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    );

    if (!teamWorkspace?.success) {
      return (
        <div className="student-updates-section team-workspace-wrapper">
          {headerRow}
          <div className="empty-state" style={{ marginTop: 12 }}>
            <p>No workspace found</p>
            <span>Ask the team leader to fill the project workspace.</span>
          </div>
        </div>
      );
    }

    const { team, project, docs, updates } = teamWorkspace;

    return (
      <div className="student-updates-section team-workspace-wrapper">
        {headerRow}

        <div className="workspace-card">
          <h3>{team?.teamName}</h3>
          <p><strong>Members:</strong> {team?.teamMembers?.map(m => m.name).join(', ') || '—'}</p>
          <p><strong>Guide:</strong> {team?.assignedTeacher?.name || '—'}</p>
        </div>

        <div className="workspace-card">
          <h3>Project Details</h3>
          {project ? (
            <>
              <p><strong>Title:</strong> {project.title}</p>
              <p><strong>Domain:</strong> {project.domain || '—'}</p>
              <p><strong>Tech Stack:</strong> {project.techStack?.join(', ') || '—'}</p>
              <p><strong>Phase:</strong> {project.currentPhase || '—'}</p>
              <p><strong>Description:</strong> {project.description || '—'}</p>
              <p><strong>Problem Statement:</strong> {project.problemStatement || '—'}</p>
              <p><strong>Objectives:</strong> {project.objectives?.length ? project.objectives.join(' | ') : '—'}</p>
              <p><strong>Repo:</strong> {project.repoUrl || '—'}</p>
              <p><strong>Demo:</strong> {project.demoUrl || '—'}</p>
              <p>
                <strong>Timeline:</strong>{' '}
                {project.startDate ? String(project.startDate).slice(0, 10) : '—'} to{' '}
                {project.endDate ? String(project.endDate).slice(0, 10) : '—'}
              </p>
            </>
          ) : (
            <div className="empty-state">
              <p>No project workspace data yet</p>
              <span>Team leader must save the workspace.</span>
            </div>
          )}
        </div>

        <div className="workspace-card">
          <h3>Documents</h3>
          {!docs || docs.length === 0 ? (
            <p>No documents shared yet</p>
          ) : (
            <ul className="comments-list">
              {docs.map(d => (
                <li key={d._id} className="comment-item">
                <strong>
                  <a
                    href={`${process.env.REACT_APP_API_URL}/uploads/${d.fileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    style={{ color: '#2563eb', textDecoration: 'underline' }}
                  >
                    {d.fileName}
                  </a>
                </strong>
              
                {d.description && <p>{d.description}</p>}
              
                <small>
                  By: {d.studentId?.name || 'Student'} | {formatDate(d.createdAt)}
                </small>
              </li>
              ))}
            </ul>
          )}
        </div>

        {/* ✅ RUBRIC EVALUATION */}
        <div className="workspace-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Rubric Evaluation</h3>

            {rubricLocked ? (
              <button
                type="button"
                className="submit-button"
                onClick={() => setRubricLocked(false)}
                style={{ padding: '8px 12px' }}
              >
                ✏️ Edit
              </button>
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Editing enabled
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', margin: '14px 0' }}>
            <button
              type="button"
              className={`nav-pill ${phase === 'phase1' ? 'active' : ''}`}
              onClick={() => switchPhase('phase1')}
            >
              Phase 1
            </button>
            <button
              type="button"
              className={`nav-pill ${phase === 'phase2' ? 'active' : ''}`}
              onClick={() => switchPhase('phase2')}
            >
              Phase 2
            </button>
            <button
              type="button"
              className={`nav-pill ${phase === 'final' ? 'active' : ''}`}
              onClick={() => switchPhase('final')}
            >
              Final
            </button>
          </div>

          {rubricLoading ? (
            <div className="loading-state">Loading evaluation...</div>
          ) : (
            <>
              <div className="rubric-table">
                <div className="rubric-head">
                  <div>Criteria</div>
                  <div>Score</div>
                  <div>Max</div>
                </div>

                {rubricRows.map(r => (
                  <div className="rubric-row" key={r.key}>
                    <div className="rubric-criteria">{r.label}</div>

                    <div>
                      {rubricLocked ? (
                        <div className="rubric-score-view">
                          {Number(r.score)}/{Number(r.max)}
                        </div>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={r.max}
                          value={r.score}
                          onChange={(e) => updateScore(r.key, e.target.value)}
                          className="rubric-input"
                        />
                      )}
                    </div>

                    <div className="rubric-max">{r.max}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '12px', fontWeight: 600 }}>
                Total: {total} / {maxTotal}
              </div>

              <div style={{ marginTop: '14px' }}>
                <h4 style={{ marginBottom: '8px' }}>Remarks</h4>

                {rubricLocked ? (
                  <div className="rubric-remarks-view">
                    {remarks?.trim() ? remarks : '—'}
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Write overall feedback..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                )}
              </div>

              <button
                className="submit-button"
                onClick={saveRubric}
                disabled={rubricLocked || rubricLoading}
                style={{ width: '100%', marginTop: '14px' }}
              >
                {rubricLocked ? 'Saved' : 'Save Evaluation'}
              </button>

              {/* ✅ AI PROGRESS (AFTER RUBRIC SAVE BUTTON) */}
              <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <h3 style={{ margin: 0 }}>AI Progress Evaluation</h3>

                  <button
                    type="button"
                    className="submit-button"
                    onClick={runAIProgress}
                    disabled={aiRunning || aiLoading}
                    style={{ padding: '8px 12px' }}
                  >
                    {aiRunning ? 'Generating...' : 'Generate AI Progress'}
                  </button>
                </div>

                {aiLoading ? (
                  <div className="loading-state" style={{ marginTop: 10 }}>Loading AI progress...</div>
                ) : !aiEvaluation ? (
                  <div className="empty-state" style={{ marginTop: 10 }}>
                    <p>No AI progress generated yet</p>
                    <span>Click “Generate AI Progress” to create evaluation for this phase.</span>
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>
                      Score: {aiEvaluation.progressScore}/100
                    </div>

                    {aiEvaluation.summary && (
                      <div style={{ marginBottom: 12 }}>
                        <strong>Summary:</strong>
                        <div style={{ marginTop: 6 }}>{aiEvaluation.summary}</div>
                      </div>
                    )}

                    {Array.isArray(aiEvaluation.strengths) && aiEvaluation.strengths.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <strong>Strengths:</strong>
                        <ul style={{ marginTop: 6 }}>
                          {aiEvaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(aiEvaluation.risks) && aiEvaluation.risks.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <strong>Risks:</strong>
                        <ul style={{ marginTop: 6 }}>
                          {aiEvaluation.risks.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(aiEvaluation.nextActions) && aiEvaluation.nextActions.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <strong>Next Actions:</strong>
                        <ul style={{ marginTop: 6 }}>
                          {aiEvaluation.nextActions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(aiEvaluation.missingInfo) && aiEvaluation.missingInfo.length > 0 && (
                      <div style={{ marginBottom: 0 }}>
                        <strong>Missing Info:</strong>
                        <ul style={{ marginTop: 6 }}>
                          {aiEvaluation.missingInfo.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ✅ UPDATES + COMMENT (from your second code) */}
        <div className="workspace-updates-container">
          <div className="updates-list">
            <h3>Team Updates</h3>
            {!updates || updates.length === 0 ? (
              <div className="empty-state">
                <p>No updates yet</p>
                <span>Students will appear here once they submit updates</span>
              </div>
            ) : (
              <ul className="student-updates">
                {updates.map(u => (
                  <li
                    key={u._id}
                    className={`update-item ${selectedUpdate?._id === u._id ? 'selected' : ''}`}
                    onClick={() =>
                      handleSelectUpdate({ ...u, studentName: u.studentId?.name || 'Student' })
                    }
                  >
                    <div className="update-header">
                      <strong>{u.studentId?.name || 'Student'}</strong>
                      <span className="timestamp">{formatDate(u.createdAt)}</span>
                    </div>
                    <p className="update-preview">
                      {u.message?.slice(0, 100)}
                      {u.message?.length > 100 && '...'}
                    </p>
                    {u.comments?.length > 0 && (
                      <div className="comment-count">
                        {u.comments.length} comment{u.comments.length !== 1 && 's'}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="update-details">
            {selectedUpdate ? (
              <div className="selected-update">
                <h3>Update from {selectedUpdate.studentName}</h3>
                <p><strong>Project:</strong> {selectedUpdate.projectName || project?.title || '—'}</p>
                <p><strong>Sent on:</strong> {formatDate(selectedUpdate.createdAt)}</p>

                <div className="update-message">
                  <p>{selectedUpdate.message}</p>
                </div>

                <div className="previous-comments">
                  <h4>Previous Comments</h4>
                  {selectedUpdate.comments?.length > 0 ? (
                    <ul className="comments-list">
                      {selectedUpdate.comments.map((c, i) => (
                        <li key={i} className="comment-item">
                          <div className="comment-header">
                            <strong>{c.sender === 'teacher' ? 'You' : selectedUpdate.studentName}</strong>
                            <span className="timestamp">{formatDate(c.timestamp)}</span>
                          </div>
                          <p className="comment-text">{c.text}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No comments yet</p>
                  )}
                </div>

                <div className="comment-form">
                  <h4>Add Comment</h4>
                  <textarea
                    rows={4}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write your feedback..."
                    disabled={isSending}
                  />
                  <button
                    className="submit-button"
                    onClick={sendComment}
                    disabled={!commentText.trim() || isSending}
                  >
                    {isSending ? 'Sending...' : 'Send Comment'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-update-selected">
                <p>Select a team update to view details</p>
                <span>Provide feedback and track progress here</span>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="teacher-dashboard-container">
      <Sidebar />
      <div className="content-area">
        <h1>Team Workspace</h1>
        {renderTeamWorkspace()}
      </div>
      <ToastContainer />
    </div>
  );
};

export default TProjectStatus;