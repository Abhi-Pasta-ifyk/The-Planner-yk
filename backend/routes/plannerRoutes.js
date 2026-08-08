const express = require('express');
const router = express.Router();
const PlannerItem = require('../models/PlannerItem');
const { protect: auth } = require('../middleware/authMiddleware');

// @route   GET /api/planner
// @desc    Get all revision planner items for a user
router.get('/', auth, async (req, res) => {
  try {
    const items = await PlannerItem.find({ user: req.user.id });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/planner
// @desc    Create a new revision topic
router.post('/', auth, async (req, res) => {
  try {
    const newItem = new PlannerItem({ ...req.body, user: req.user.id });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   PUT /api/planner/:id
// @desc    Update a revision topic (dates, checkboxes, confidence, etc.)
router.put('/:id', auth, async (req, res) => {
  try {
    const { _id, user, createdAt, updatedAt, __v, ...updateData } = req.body;
    
    const updatedItem = await PlannerItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updateData },
      { returnDocument: 'after' } 
    );
    
    if (!updatedItem) return res.status(404).json({ error: 'Planner item not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   DELETE /api/planner/:id
// @desc    Delete a revision topic
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedItem = await PlannerItem.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedItem) return res.status(404).json({ error: 'Planner item not found' });
    res.json({ message: 'Planner item removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;