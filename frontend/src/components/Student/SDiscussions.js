import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { handleSuccess } from '../../utils';
import Sidebar from './SSidebar';
import Header from './SHeader';
// import '../../css/StudentCss/StudentDashboardLayout.css';
import '../../css/StudentCss/sDiscussions.css';

const SDiscussions = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const navigate = useNavigate();
  
  // State for contacts/messages
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Lio', email: 'lio@example.com', avatar: '/avatars/lio.jpg', messages: [] },
    { id: 2, name: 'Mrs. Jane', email: 'jane@example.com', avatar: '/avatars/jane.jpg', messages: [] },
    { id: 3, name: 'Doe', email: 'doe@example.com', avatar: '/avatars/doe.jpg', messages: [] },
    { id: 4, name: 'Mrs.Melisa', email: 'melisa@example.com', avatar: '/avatars/melisa.jpg', messages: [] }
  ]);
  
  // State for new contact form
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');
  
  // State for selected contact
  const [selectedContactId, setSelectedContactId] = useState(null);
  
  // State for message input
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      setLoggedInUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    handleSuccess('User Loggedout');
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };
  
  // Get selected contact
  const selectedContact = contacts.find(contact => contact.id === selectedContactId);
  
  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedContactId) return;
    
    // Create new message
    const newMessage = {
      id: Date.now(),
      text: messageInput,
      sender: 'me',
      timestamp: new Date().toISOString()
    };
    
    // Update contact's messages
    setContacts(contacts.map(contact => {
      if (contact.id === selectedContactId) {
        return {
          ...contact,
          messages: [...contact.messages, newMessage]
        };
      }
      return contact;
    }));
    
    // Clear input
    setMessageInput('');
    
    // Simulate a reply after a short delay
    setTimeout(() => {
      const replyMessage = {
        id: Date.now() + 1,
        text: `This is a reply from ${selectedContact.name}`,
        sender: selectedContact.id,
        timestamp: new Date().toISOString()
      };
      
      setContacts(prevContacts => prevContacts.map(contact => {
        if (contact.id === selectedContactId) {
          return {
            ...contact,
            messages: [...contact.messages, replyMessage]
          };
        }
        return contact;
      }));
    }, 1000);
  };
  
  // Handle adding a new contact
  const handleAddContact = (e) => {
    e.preventDefault();
    
    if (!newContactEmail.trim() || !newContactName.trim()) {
      alert('Please enter both name and email');
      return;
    }
    
    // Create new contact
    const newContact = {
      id: contacts.length + 1,
      name: newContactName,
      email: newContactEmail,
      avatar: '/avatars/default.jpg', // Default avatar
      messages: []
    };
    
    // Add to contacts
    setContacts([...contacts, newContact]);
    
    // Reset form
    setNewContactEmail('');
    setNewContactName('');
    setShowNewContactForm(false);
  };

  return (
    <div className="student-dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="content-area">
        <h1>Welcome, {loggedInUser?.name}</h1>
        <div className="chat-layout">
          {/* Contacts List */}
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
                <form onSubmit={handleAddContact}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    required
                  />
                  <div className="form-buttons">
                    <button type="submit">Add</button>
                    <button 
                      type="button" 
                      onClick={() => setShowNewContactForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Contacts List */}
            <div className="contacts-list">
              {contacts.map(contact => (
                <div 
                  key={contact.id}
                  className={`contact-item ${selectedContactId === contact.id ? 'selected' : ''}`}
                  onClick={() => setSelectedContactId(contact.id)}
                >
                  <div className="contact-avatar">
                    <img src={contact.avatar} alt={contact.name} />
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
                    <img src={selectedContact.avatar} alt={selectedContact.name} />
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">{selectedContact.name}</div>
                    <div className="contact-email">{selectedContact.email}</div>
                  </div>
                </div>
                
                <div className="messages-container">
                  {selectedContact.messages.length > 0 ? (
                    selectedContact.messages.map(message => (
                      <div 
                        key={message.id}
                        className={`message ${message.sender === 'me' ? 'sent' : 'received'}`}
                      >
                        <div className="message-bubble">
                          {message.text}
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
                </div>
                
                <form className="message-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                  />
                  <button type="submit">Send</button>
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
      <ToastContainer />
    </div>
  );
};

export default SDiscussions;