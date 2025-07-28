import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { handleSuccess } from '../../utils';
import Sidebar from './SSidebar';
import Header from './SHeader';
// import '../../css/StudentCss/StudentDashboardLayout.css';
import '../../css/StudentCss/sDiscussions.css';
import io from 'socket.io-client';
import axios from 'axios';

const SDiscussions = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  
  // State for contacts/messages
  const [contacts, setContacts] = useState([]);
  const [discussions, setDiscussions] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  
  // State for new contact form
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  // State for selected contact and messages
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [currentDiscussionId, setCurrentDiscussionId] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  // Auto scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [discussions, selectedContactId]);

  // Function to search users
  const searchUsers = async (query) => {
    try {
      setIsSearching(true);
      console.log('Starting search with query:', query);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        toast.error('Please login again');
        navigate('/login');
        return;
      }

      console.log('Making API request with token:', token);
      const response = await axios.get(
        `http://localhost:8000/api/student/search-users?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      console.log('Search response:', response.data);
      if (Array.isArray(response.data)) {
        setSearchResults(response.data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(error.response.data.message || 'Error searching users');
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('No response from server');
      } else {
        console.error('Error setting up request:', error.message);
        toast.error('Error setting up request');
      }
      if (!isConnected) {
        toast.error('Chat server not connected');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e, field) => {
    const value = e.target.value;
    if (field === 'name') {
      setNewContactName(value);
    } else {
      setNewContactEmail(value);
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(value);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (user) => {
    console.log('Selected user from search:', user);
    setNewContactName(user.name);
    setNewContactEmail(user.email);
    setShowSuggestions(false);
    setSearchResults([]);
    handleContactSelect(user._id); // Immediately start chat with selected user
    setShowNewContactForm(false); // Close the form after selection
  };

  // Click outside handler to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.input-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      const user = JSON.parse(userData);
      setLoggedInUser(user);
      
      // Connect to Socket.IO server
      socketRef.current = io('http://localhost:8000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      // Socket connection handlers
      socketRef.current.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnected(true);
        toast.success('Chat connected successfully');
        
        // Register user after connection
        socketRef.current.emit('register', {
          userId: user._id,
          name: user.name,
          email: user.email
        });
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        toast.error('Chat connection failed. Please try again.');
      });
      
      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setIsConnected(false);
        toast.warn('Chat disconnected');
      });
      
      // Listen for user list updates
      socketRef.current.on('userList', (users) => {
        console.log('Received user list:', users);
        const filteredUsers = users.filter(u => u.userId !== user._id);
        setContacts(filteredUsers);
      });

      // Listen for chat initialization
      socketRef.current.on('chatInitialized', ({ discussionId, messages }) => {
        console.log('Chat initialized:', { discussionId, messages });
        setDiscussions(prev => ({
          ...prev,
          [discussionId]: messages
        }));
        setCurrentDiscussionId(discussionId);
      });
      
      // Listen for incoming messages
      socketRef.current.on('receiveMessage', ({ discussionId, message }) => {
        console.log('Received message:', { discussionId, message });
        setDiscussions(prev => ({
          ...prev,
          [discussionId]: [...(prev[discussionId] || []), message]
        }));
      });
      
      // Listen for sent message confirmation
      socketRef.current.on('messageSent', ({ discussionId, message }) => {
        console.log('Message sent confirmation:', { discussionId, message });
        setDiscussions(prev => ({
          ...prev,
          [discussionId]: [...(prev[discussionId] || []), message]
        }));
        setMessageInput('');
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, []);

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('User Logged out');
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  // Get current discussion messages
  const currentMessages = currentDiscussionId ? discussions[currentDiscussionId] || [] : [];
  const selectedContact = contacts.find(c => c.userId === selectedContactId);

  const handleContactSelect = (contactId) => {
    console.log('Selecting contact:', contactId);
    setSelectedContactId(contactId);
    if (loggedInUser && contactId) {
      console.log('Initializing chat with:', { userId: loggedInUser._id, targetUserId: contactId });
      socketRef.current.emit('initializeChat', {
        userId: loggedInUser._id,
        targetUserId: contactId
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedContactId || !currentDiscussionId) {
      console.log('Cannot send message:', { messageInput, selectedContactId, currentDiscussionId });
      return;
    }
    
    const selectedContact = contacts.find(c => c.userId === selectedContactId);
    if (!selectedContact) {
      console.log('Selected contact not found:', selectedContactId);
      return;
    }

    console.log('Sending message:', {
      discussionId: currentDiscussionId,
      from: {
        userId: loggedInUser._id,
        name: loggedInUser.name,
        email: loggedInUser.email
      },
      to: {
        userId: selectedContact.userId,
        name: selectedContact.name,
        email: selectedContact.email
      },
      content: messageInput
    });

    socketRef.current.emit('sendMessage', {
      discussionId: currentDiscussionId,
      from: {
        userId: loggedInUser._id,
        name: loggedInUser.name,
        email: loggedInUser.email
      },
      to: {
        userId: selectedContact.userId,
        name: selectedContact.name,
        email: selectedContact.email
      },
      content: messageInput
    });
  };

  // Handle adding a new contact
  const handleAddContact = (e) => {
    e.preventDefault();
    
    if (!newContactEmail.trim() || !newContactName.trim()) {
      alert('Please enter both name and email');
      return;
    }
    
    // Reset form
    setNewContactEmail('');
    setNewContactName('');
    setShowSuggestions(false);
    setShowNewContactForm(false);
  };

  return (
    <div className="student-dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <h1>Welcome, {loggedInUser?.name}</h1>
        <div className="chat-layout">
          {/* Contacts Panel */}
          <div className="contacts-panel">
            <div className="contacts-header">
              <h2>Messages</h2>
              <button 
                className="add-contact-button"
                onClick={() => setShowNewContactForm(true)}
              >
                + New Chat
              </button>
            </div>
            
            {/* New Contact Form */}
            {showNewContactForm && (
              <div className="new-contact-form">
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={newContactName}
                    onChange={(e) => handleInputChange(e, 'name')}
                  />
                  {isSearching && <div className="search-loading">Searching...</div>}
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="suggestions-list">
                      {searchResults.map(user => (
                        <div
                          key={user._id}
                          className="suggestion-item"
                          onClick={() => handleSelectSuggestion(user)}
                        >
                          <div className="suggestion-name">{user.name}</div>
                          <div className="suggestion-email">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showSuggestions && searchResults.length === 0 && !isSearching && (
                    <div className="no-results">No users found</div>
                  )}
                </div>
              </div>
            )}
            
            {/* Contacts List */}
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
          
          {/* Chat Area */}
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
                  {currentMessages.length > 0 ? (
                    currentMessages.map((message, index) => (
                      <div 
                        key={index}
                        className={`message ${message.sender === loggedInUser?._id ? 'sent' : 'received'}`}
                      >
                        <div className="message-bubble">
                          {message.content}
                        </div>
                        <div className="message-time">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-messages">
                      Start a conversation with {selectedContact.name}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <form className="message-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <button type="submit" disabled={!messageInput.trim()}>Send</button>
                </form>
              </>
            ) : (
              <div className="no-contact-selected">
                <div className="placeholder-message">
                  Select a contact to start chatting
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default SDiscussions;