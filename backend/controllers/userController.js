const User = require('../models/User'); // Adjust path to your User model
const Subject = require('../models/Subject'); 
const Goal = require('../models/Goal');
const Task = require('../models/Task');
const Planner = require('../models/Planner');
const MonthlyRecord = require('../models/MonthlyRecord');
const Habit = require('../models/Habit');
const bcrypt = require('bcryptjs');

// @desc    Update user password
// @route   PUT /api/users/update-password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // 1. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // 2. Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating password' });
  }
};

// @desc    Export all user data as JSON
// @route   GET /api/users/export
// @access  Private
const exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Gather all documents belonging to the user
    const [subjects, goals, tasks, planner, monthlyRecords, habits] = await Promise.all([
      Subject.find({ user: userId }),
      Goal.find({ user: userId }),
      Task.find({ user: userId }),
      Planner.find({ user: userId }),
      MonthlyRecord.find({ user: userId }),
      Habit.find({ user: userId })
    ]);

    // Compile into a single JSON object
    const exportData = {
      exportDate: new Date(),
      user: { name: req.user.name, email: req.user.email },
      data: { subjects, goals, tasks, planner, monthlyRecords, habits }
    };

    res.status(200).json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export data' });
  }
};

// @desc    Wipe all planner/tracker data but keep account
// @route   DELETE /api/users/wipe-data
// @access  Private
const wipeAllData = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Delete all records associated with this user
    await Promise.all([
      Subject.deleteMany({ user: userId }),
      Goal.deleteMany({ user: userId }),
      Task.deleteMany({ user: userId }),
      Planner.deleteMany({ user: userId }),
      MonthlyRecord.deleteMany({ user: userId }),
      Habit.deleteMany({ user: userId })
    ]);

    res.status(200).json({ message: 'All tracker data has been wiped clean.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to wipe data' });
  }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/users/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 1. Wipe data
    await Promise.all([
      Subject.deleteMany({ user: userId }),
      Goal.deleteMany({ user: userId }),
      Task.deleteMany({ user: userId }),
      Planner.deleteMany({ user: userId }),
      MonthlyRecord.deleteMany({ user: userId }),
      Habit.deleteMany({ user: userId })
    ]);

    // 2. Delete the user
    await User.findByIdAndDelete(userId);

    // 3. Clear the auth cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.status(200).json({ message: 'Account permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete account' });
  }
};

module.exports = { updatePassword, exportUserData, wipeAllData, deleteAccount };