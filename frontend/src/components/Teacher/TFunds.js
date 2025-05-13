import React, { useState, useEffect } from 'react';
import axios from '../Api/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './TSidebar';
import Header from './THeader';
import '../../css/TeacherCss/tFunds.css';

function TFunds({ user, onLogout }) {
  const [fundingRequests, setFundingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  useEffect(() => {
    loadFundingRequests();
  }, []);

  // Load funding requests for the assigned teacher
  const loadFundingRequests = async () => {
    try {
      const response = await axios.get('/teacher/funds', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFundingRequests(response.data.funds);
    } catch (error) {
      console.error("Error loading funding requests:", error);
      toast.error("Failed to load funding requests");
    }
  };

  // Handle decision (approve/reject) on a funding request
  const handleRequestDecision = async (requestId, decision) => {
    try {
      await axios.post('/teacher/funds/assign', {
        fundId: requestId,
        status: decision,
        teacherComments: decisionNotes
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success(`Request ${decision} successfully`);
      loadFundingRequests();
      setDecisionNotes('');
      setExpandedRequestId(null);
    } catch (error) {
      console.error("Error processing decision:", error);
      toast.error("Failed to process your decision");
    }
  };

  // Toggle expanded request view
  const toggleExpandRequest = (requestId) => {
    if (expandedRequestId === requestId) {
      setExpandedRequestId(null);
    } else {
      setExpandedRequestId(requestId);
      setDecisionNotes('');
    }
  };

  // Filter requests based on the active tab (Pending, Approved, Rejected)
  const filteredRequests = fundingRequests.filter(request => {
    if (activeTab === 'Pending') return request.status === 'Pending';
    if (activeTab === 'Approved') return request.status === 'Approved';
    if (activeTab === 'Rejected') return request.status === 'Rejected';
    return true;
  });

  // Format date to a readable format
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="project-Funds-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <Header user={user} />
        <div className="project-content">
          <h1>Project Funding Requests</h1>

          <div className="status-tabs">
            {['Pending', 'Approved', 'Rejected'].map(tab => (
              <button
                key={tab}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="requests-list">
            {filteredRequests.length === 0 ? (
              <div className="no-requests-message">
                <p>No {activeTab} funding requests found.</p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div
                  key={request._id}
                  className={`request-card ${request.status}`}
                >
                  <div
                    className="request-header"
                    onClick={() => toggleExpandRequest(request._id)}
                  >
                    <div className="request-summary">
                      <h3>{request.teamName}</h3>
                      <div className="request-meta">
                        <span className="request-amount">Rs. {request.amount}</span>
                        <span className={`status-badge ${request.status}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    <div className="expand-icon">
                      {expandedRequestId === request._id ? '▼' : '►'}
                    </div>
                  </div>

                  {expandedRequestId === request._id && (
                    <div className="request-details">
                      <div className="detail-row">
                        <span className="detail-label">Reason:</span>
                        <span className="detail-value">{request.reason}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Submitted:</span>
                        <span className="detail-value">{formatDate(request.createdAt)}</span>
                      </div>

                      {request.status === 'Pending' ? (
                        <div className="decision-section">
                          <div className="notes-input">
                            <label>Decision Notes (optional):</label>
                            <textarea
                              value={decisionNotes}
                              onChange={(e) => setDecisionNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="decision-buttons">
                            <button
                              className="reject-button"
                              onClick={() => handleRequestDecision(request._id, 'Rejected')}
                            >
                              Reject Request
                            </button>
                            <button
                              className="approve-button"
                              onClick={() => handleRequestDecision(request._id, 'Approved')}
                            >
                              Approve Funding
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="decision-info">
                          <div className="detail-row">
                            <span className="detail-label">Comments:</span>
                            <p className="decision-notes">{request.teacherComments || 'No remarks'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export default TFunds;
