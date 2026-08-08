const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate token, attach it to a secure cookie, and send response
const sendTokenResponse = (user, statusCode, res) => {
  // 1. Create the JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
    expiresIn: '30d' 
  });

  // 2. Define military-grade cookie security options
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Matches the 30-day JWT lifespan
    httpOnly: true, // CRITICAL: Makes the cookie invisible to frontend JavaScript (Defeats XSS)
    secure: process.env.NODE_ENV === 'production', // Uses secure HTTPS only in production
    sameSite: 'strict' // CRITICAL: Prevents CSRF (Cross-Site Request Forgery) attacks
  };

  // 3. Send the cookie AND the user data (Notice we are NO LONGER sending the token in the JSON body!)
  res.status(statusCode).cookie('token', token, options).json({
    _id: user._id,
    name: user.name,
    email: user.email
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (Password hashing is handled automatically by the User model's pre-save hook)
    const user = await User.create({ name, email, password });

    if (user) {
      sendTokenResponse(user, 201, res);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      sendTokenResponse(user, 200, res);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user / clear secure cookie
// @route   POST /api/auth/logout
exports.logoutUser = (req, res) => {
  // To "delete" an httpOnly cookie, we overwrite it with a blank one that expires immediately
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true,
  });
  
  res.status(200).json({ message: 'User logged out successfully' });
};