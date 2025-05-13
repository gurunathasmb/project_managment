const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Verify JWT Token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Verify User Role
const verifyRole = (requiredRole) => (req, res, next) => {
  if (!req.user || req.user.role !== requiredRole) {
    return res.status(403).json({ success: false, message: 'Access denied: Role mismatch' });
  }
  next();
};

module.exports = { verifyToken, verifyRole };
