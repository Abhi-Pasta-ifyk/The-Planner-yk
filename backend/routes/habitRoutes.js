const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const { protect: auth } = require('../middleware/authMiddleware');

// @route   GET /api/habits/:monthKey
router.get('/:monthKey', auth, async (req, res) => {
  try {
    let habits = await Habit.find({ user: req.user.id, monthKey: req.params.monthKey });
    
    // If no habits exist for this month yet, auto-populate the default UPSC habits!
    if (habits.length === 0) {
      const defaultHabits = [
        { user: req.user.id, monthKey: req.params.monthKey, name: 'The Hindu', completedDays: [] },
        { user: req.user.id, monthKey: req.params.monthKey, name: 'PYQ Practice', completedDays: [] },
        { user: req.user.id, monthKey: req.params.monthKey, name: '8h Sleep', completedDays: [] }
      ];
      habits = await Habit.insertMany(defaultHabits);
    }
    
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/habits
router.post('/', auth, async (req, res) => {
  try {
    const newHabit = new Habit({ ...req.body, user: req.user.id });
    const savedHabit = await newHabit.save();
    res.status(201).json(savedHabit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   PUT /api/habits/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { _id, user, createdAt, updatedAt, __v, ...updateData } = req.body;
    const updatedHabit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    res.json(updatedHabit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   DELETE /api/habits/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Habit.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Habit removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;