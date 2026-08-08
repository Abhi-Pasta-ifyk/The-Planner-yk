const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // <-- IMPORTED PROTECT MIDDLEWARE

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser); 

// --- SESSION CHECK ROUTE ---
// React calls this on refresh to see if the HTTP-only cookie is still valid
router.get('/me', protect, (req, res) => {
    // If the protect middleware successfully verifies the cookie, 
    // it attaches the user to req.user. We just send it back!
    res.status(200).json(req.user); 
});

module.exports = router;