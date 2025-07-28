const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Verify JWT Token
const verifyToken = async (req, res, next) => {
  try {
    console.log('Verifying token...');
    console.log('Headers:', req.headers);
    
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found');
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token.substring(0, 10) + '...');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', decoded);

      const user = await User.findById(decoded.id);
      console.log('User found:', user ? 'Yes' : 'No');

      if (!user) {
        console.log('No user found with token ID');
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      console.log('User attached to request');
      next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

// Verify User Role
const verifyRole = (role) => {
  return (req, res, next) => {
    console.log('Verifying role:', role);
    console.log('User role:', req.user?.role);
    
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ message: 'User not found' });
    }

    if (req.user.role !== role) {
      console.log('Role mismatch');
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Role verification successful');
    next();
  };
};

module.exports = { verifyToken, verifyRole };
