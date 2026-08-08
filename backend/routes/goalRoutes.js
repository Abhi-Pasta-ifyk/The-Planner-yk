const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const { protect: auth } = require('../middleware/authMiddleware');

// @route   GET /api/goals
// @desc    Get all goals for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/goals
// @desc    Create a new goal
router.post('/', auth, async (req, res) => {
  try {
    const newGoal = new Goal({
      ...req.body,
      user: req.user.id
    });
    const savedGoal = await newGoal.save();
    res.status(201).json(savedGoal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal (status, title, etc.)
router.put('/:id', auth, async (req, res) => {
  try {
    const { _id, user, createdAt, updatedAt, __v, ...updateData } = req.body;
    
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updateData },
      { returnDocument: 'after' } // FIXED DEPRECATION WARNING
    );
    
    if (!updatedGoal) return res.status(404).json({ error: 'Goal not found' });
    res.json(updatedGoal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedGoal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedGoal) return res.status(404).json({ error: 'Goal not found' });
    res.json({ message: 'Goal removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;