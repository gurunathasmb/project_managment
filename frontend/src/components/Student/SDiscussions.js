import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import Sidebar from './SSidebar';
import '../../css/StudentCss/sDiscussions.css';
import io from 'socket.io-client';

const SDiscussions = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [discussions, setDiscussions] = useState({});
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [currentDiscussionId, setCurrentDiscussionId] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discussions, selectedContactId]);

  /* ================= SOCKET SETUP ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem('loggedInUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    setLoggedInUser(user);

    socketRef.current = io(process.env.REACT_APP_API_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('register', {
        userId: user._id,
        name: user.name,
        email: user.email,
      });
    });

    socketRef.current.on('userList', (users) => {
      setContacts(users.filter(u => u.userId !== user._id));
    });

    socketRef.current.on('chatInitialized', ({ discussionId, messages }) => {
      setDiscussions(prev => ({
        ...prev,
        [discussionId]: messages,
      }));
      setCurrentDiscussionId(discussionId);
    });

    socketRef.current.on('receiveMessage', ({ discussionId, message }) => {
      setDiscussions(prev => ({
        ...prev,
        [discussionId]: [...(prev[discussionId] || []), message],
      }));
    });

    socketRef.current.on('messageSent', ({ discussionId, message }) => {
      setDiscussions(prev => ({
        ...prev,
        [discussionId]: [...(prev[discussionId] || []), message],
      }));
      setMessageInput('');
    });

    return () => socketRef.current.disconnect();
  }, [navigate]);

  /* ================= HANDLERS ================= */
  const handleContactSelect = (contactId) => {
    setSelectedContactId(contactId);

    socketRef.current.emit('initializeChat', {
      userId: loggedInUser._id,
      targetUserId: contactId,
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentDiscussionId || !selectedContactId) return;

    const selectedContact = contacts.find(c => c.userId === selectedContactId);
    if (!selectedContact) return;

    // ✅ BACKEND EXPECTED FORMAT
    socketRef.current.emit('sendMessage', {
      discussionId: currentDiscussionId,
      from: {
        userId: loggedInUser._id,
        name: loggedInUser.name,
        email: loggedInUser.email,
      },
      to: {
        userId: selectedContact.userId,
        name: selectedContact.name,
        email: selectedContact.email,
      },
      content: messageInput,
    });
  };

  const handleLogout = () => {
    socketRef.current.disconnect();
    localStorage.clear();
    navigate('/login');
  };

  /* ================= DATA ================= */
  const currentMessages = currentDiscussionId
    ? discussions[currentDiscussionId] || []
    : [];

  const selectedContact = contacts.find(c => c.userId === selectedContactId);

  /* ================= UI ================= */
  return (
    <div className="student-dashboard-container">
      <Sidebar onLogout={handleLogout} />

      <div className="content-area">
        <h1>Welcome, {loggedInUser?.name}</h1>

        <div className="chat-layout">
          {/* CONTACTS */}
          <div className="contacts-panel">
            <div className="contacts-header">
              <h2>Messages</h2>
            </div>

            <div className="contacts-list">
              {contacts.map(contact => (
                <div
                  key={contact.userId}
                  className={`contact-item ${selectedContactId === contact.userId ? 'selected' : ''}`}
                  onClick={() => handleContactSelect(contact.userId)}
                >
                  <div className="contact-avatar">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">{contact.name}</div>
                    <div className="contact-email">{contact.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHAT */}
          <div className="chat-area">
            {selectedContact ? (
              <>
                <div className="chat-header">
                  <div className="contact-avatar">
                    {selectedContact.name.charAt(0)}
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">{selectedContact.name}</div>
                    <div className="contact-email">{selectedContact.email}</div>
                  </div>
                </div>

                <div className="messages-container">
                  {currentMessages.map((message, index) => {
                    // 🔥 FINAL BULLETPROOF SENDER DETECTION
                    const senderId =
                      typeof message.sender === 'object'
                        ? message.sender._id
                        : message.sender;

                    const isSender =
                      String(senderId) === String(loggedInUser?._id);

                    return (
                      <div
                        key={index}
                        className={`message ${isSender ? 'sent' : 'received'}`}
                      >
                        <div className="message-bubble">
                          {message.content}
                        </div>
                        <div className="message-time">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form className="message-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <button type="submit" disabled={!messageInput.trim()}>
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="no-contact-selected">
                Select a contact to start chatting
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default SDiscussions;
