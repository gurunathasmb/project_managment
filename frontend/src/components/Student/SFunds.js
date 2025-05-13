import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Sidebar from './SSidebar'; // You must have this component
import '../../css/StudentCss/sFunds.css'; // Your CSS
import axios from '../Api/axios'; // Your axios instance

const SFunds = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [team, setTeam] = useState('');
  const [assignedTeacher, setAssignedTeacher] = useState('');
  const navigate = useNavigate();

  // Fetch user, team, and transactions on mount
  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      setLoggedInUser(JSON.parse(userData));
      fetchTeamInfo();
      fetchTransactions();
    } else {
      navigate('/login');
    }
    // eslint-disable-next-line
  }, []);

  // Fetch team info for the logged-in student
  const fetchTeamInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/student/teammember', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.team) {
        setTeam(res.data.team.teamName);
        setAssignedTeacher(res.data.team.assignedTeacher?.name || '');
      } else {
        setTeam('');
        setAssignedTeacher('');
        toast.error('Team not found. Please create or join a team.');
      }
    } catch (error) {
      setTeam('');
      setAssignedTeacher('');
      toast.error('Failed to load team info');
    }
  };

  // Fetch fund requests for the student
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/student/fund-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort by latest first
      const sorted = (res.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTransactions(sorted);
    } catch (error) {
      setTransactions([]);
      toast.error('Failed to load transactions');
    }
  };

  // Handle fund request submission
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !reason) return toast.error('Please fill all fields');
    if (!team) return toast.error('You must be in a team to request funds');
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return toast.error('Enter a valid amount');
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/student/fund-request',
        { teamName: team, amount: numericAmount, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Fund request submitted');
      setAmount('');
      setReason('');
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit fund request');
    }
  };

  // Calculate total expenditure per team
  const teamExpenditures = transactions.reduce((acc, t) => {
    acc[t.teamName] = (acc[t.teamName] || 0) + parseFloat(t.amount);
    return acc;
  }, {});
  const totalExpenditure = Object.values(teamExpenditures).reduce((a, b) => a + b, 0);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    toast.success('User Logged out');
    setTimeout(() => navigate('/login'), 1000);
  };

  return (
    <div className="student-dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <div className="page-header">
          <h1>Welcome, {loggedInUser?.name || 'Student'}</h1>
          <h2 className="section-title">Funds Management</h2>
        </div>
        <div className="funds-section">
          {/* Request Form */}
          <div className="funds-container request-section">
            <h3>Request Funds</h3>
            <form onSubmit={handleRequestSubmit}>
              <div className="form-group">
                <label htmlFor="team">Team</label>
                <input type="text" id="team" value={team} disabled />
              </div>
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <div className="input-group">
                  <span className="currency-prefix">Rs.</span>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="reason">Reason</label>
                <input
                  type="text"
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for request"
                />
              </div>
              <button type="submit" className="submit-button">Submit Request</button>
            </form>
          </div>
          {/* Expenditure Display */}
          <div className="funds-container expenditure-section">
            <h3>Team Expenditures</h3>
            <div className="team-expenditures">
              {Object.entries(teamExpenditures).map(([teamName, value]) => (
                <div key={teamName} className="team-row">
                  <span className="team-name">{teamName}</span>
                  <span className="team-amount">Rs. {value.toFixed(2)}</span>
                </div>
              ))}
              <div className="total-row">
                <span className="total-label">Total Expenditure</span>
                <span className="total-amount">Rs. {totalExpenditure.toFixed(2)}</span>
              </div>
            </div>
          </div>
          {/* Transaction History */}
          <div className="funds-container transaction-section">
            <h3>Transaction History</h3>
            <div className="transaction-list">
              {transactions.length === 0 ? (
                <p className="no-transactions">No transactions yet</p>
              ) : (
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Team</th>
                      <th>Amount</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t._id}>
                        <td>{new Date(t.createdAt).toLocaleString()}</td>
                        <td>{t.teamName}</td>
                        <td>Rs. {parseFloat(t.amount).toFixed(2)}</td>
                        <td>{t.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default SFunds;
