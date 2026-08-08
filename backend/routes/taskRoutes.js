const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect: auth } = require('../middleware/authMiddleware');

// @route   GET /api/tasks
// @desc    Get tasks (supports ?startDate=YYYY-MM-DD & endDate=YYYY-MM-DD or single ?date=YYYY-MM-DD)
router.get('/', auth, async (req, res) => {
  try {
    let query = { user: req.user.id };
    
    // Filter by date range (Weekly View) or single date (Daily View)
    if (req.query.startDate && req.query.endDate) {
      query.date = { $gte: req.query.startDate, $lte: req.query.endDate };
    } else if (req.query.date) {
      query.date = req.query.date;
    }

    // Sort by order so they appear exactly as arranged
    const tasks = await Task.find(query).sort({ order: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/tasks
router.post('/', auth, async (req, res) => {
  try {
    const newTask = new Task({ ...req.body, user: req.user.id });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { _id, user, createdAt, updatedAt, __v, ...updateData } = req.body;
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updateData },
      { returnDocument: 'after' } 
    );
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Task removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;