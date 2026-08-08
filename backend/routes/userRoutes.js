const express = require('express');
const router = express.Router();
const { updatePassword, exportUserData, wipeAllData, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All routes here require the user to be logged in
router.put('/update-password', protect, updatePassword);
router.get('/export', protect, exportUserData);
router.delete('/wipe-data', protect, wipeAllData);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;