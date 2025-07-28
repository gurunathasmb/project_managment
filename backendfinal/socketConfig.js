const socketIO = require('socket.io');
const Discussion = require('./Models/Discussion');
const User = require('./Models/User');

const connectedUsers = new Map();

const configureSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle user registration
    socket.on('register', async (userData) => {
      console.log('User registered:', userData);
      connectedUsers.set(userData.userId, socket.id);
      
      // Get all users and emit updated list
      try {
        const users = await User.find({}, 'name email');
        const userList = users.map(user => ({
          userId: user._id,
          name: user.name,
          email: user.email
        }));
        io.emit('userList', userList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    });

    // Handle chat initialization
    socket.on('initializeChat', async ({ userId, targetUserId }) => {
      try {
        console.log('Initializing chat between:', userId, 'and', targetUserId);
        
        // Find existing discussion or create new one
        let discussion = await Discussion.findOne({
          participants: { $all: [userId, targetUserId] }
        }).populate('messages.sender', 'name email');

        if (!discussion) {
          discussion = await Discussion.create({
            participants: [userId, targetUserId],
            messages: []
          });
        }

        // Emit chat initialized event with discussion details
        socket.emit('chatInitialized', {
          discussionId: discussion._id,
          messages: discussion.messages
        });

      } catch (error) {
        console.error('Error initializing chat:', error);
        socket.emit('chatError', { message: 'Failed to initialize chat' });
      }
    });

    // Handle sending messages
    socket.on('sendMessage', async ({ discussionId, from, to, content }) => {
      try {
        console.log('Sending message in discussion:', discussionId);
        
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
          throw new Error('Discussion not found');
        }

        // Create new message
        const newMessage = {
          sender: from.userId,
          content: content,
          timestamp: new Date()
        };

        // Add message to discussion
        discussion.messages.push(newMessage);
        discussion.lastMessage = new Date();
        await discussion.save();

        // Emit to sender
        socket.emit('messageSent', {
          discussionId,
          message: newMessage
        });

        // Emit to recipient if online
        const recipientSocket = connectedUsers.get(to.userId);
        if (recipientSocket) {
          io.to(recipientSocket).emit('receiveMessage', {
            discussionId,
            message: newMessage
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('messageError', { message: 'Failed to send message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Remove user from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
      // Update user list for all clients
      io.emit('userList', Array.from(connectedUsers.keys()));
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Error handling for the IO server
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });

  return io;
};

module.exports = configureSocket; 