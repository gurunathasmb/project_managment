import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Sidebar from './SSidebar';
import '../../css/StudentCss/sFunds.css';
import axios from '../Api/axios';

const SFunds = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [team, setTeam] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    setLoggedInUser(JSON.parse(userData));
    fetchTeamInfo();
    fetchTransactions();
  }, []);

  const fetchTeamInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/student/teammember', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.team) {
        setTeam(res.data.team.teamName);
      }
    } catch {
      toast.error('Failed to load team info');
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/student/fund-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data || []);
    } catch {
      toast.error('Failed to load fund requests');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !reason) return toast.error('Fill all fields');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/student/fund-request',
        { amount, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Fund request submitted');
      setAmount('');
      setReason('');
      fetchTransactions();
    } catch {
      toast.error('Failed to submit request');
    }
  };

  /* ✅ ONLY APPROVED FUNDS COUNT */
  const approvedFunds = transactions.filter(t => t.status === 'Approved');
  const totalApprovedAmount = approvedFunds.reduce(
    (sum, t) => sum + Number(t.amount), 0
  );

  return (
    <div className="student-dashboard-container">
      <Sidebar />
      <div className="content-area">
        <h1>Funds Management</h1>

        {/* REQUEST FORM */}
        <div className="funds-container">
          <h3>Request Funds</h3>
          <form onSubmit={handleRequestSubmit}>
            <input value={team} disabled />
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button className="submit-button">Submit</button>
          </form>
        </div>

        {/* EXPENDITURE */}
        <div className="funds-container">
          <h3>Total Approved Expenditure</h3>
          <p className="total-amount">Rs. {totalApprovedAmount}</p>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="funds-container">
          <h3>Transaction History</h3>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Teacher Comment</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id}>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>Rs. {t.amount}</td>
                  <td className={`status ${t.status?.toLowerCase()}`}>
                    {t.status}
                  </td>
                  <td>{t.teacherComments || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default SFunds;