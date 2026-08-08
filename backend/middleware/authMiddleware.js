const jwt = require('jsonwebtoken');
const User = require('../models/User'); // <-- UNCOMMENTED: Required to fetch the user from the database

const protect = async (req, res, next) => {
  // 🔒 SECURE HTTP-ONLY COOKIE CODE
  let token = req.cookies.token; // <-- Automatically extracted by cookie-parser!

  if (token) {
      try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = await User.findById(decoded.id).select('-password');
          next();
      } catch (error) {
          console.error('Token verification failed:', error.message);
          res.status(401).json({ message: 'Not authorized, secure token failed' });
      }
  } else {
      res.status(401).json({ message: 'Not authorized, no secure token provided' });
  }
};

module.exports = { protect };