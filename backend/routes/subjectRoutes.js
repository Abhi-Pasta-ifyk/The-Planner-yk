const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { protect: auth } = require('../middleware/authMiddleware');

// @route   GET /api/subjects
router.get('/', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user.id });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/subjects
router.post('/', auth, async (req, res) => {
  try {
    const newSubject = new Subject({
      ...req.body,
      user: req.user.id
    });
    const savedSubject = await newSubject.save();
    res.status(201).json(savedSubject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// @route   PUT /api/subjects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    // Strip immutable fields like _id before updating MongoDB
    const { _id, user, createdAt, updatedAt, __v, ...updateData } = req.body;
    
    const updatedSubject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updateData },
      { returnDocument: 'after' } // FIXED DEPRECATION WARNING
    );
    
    if (!updatedSubject) return res.status(404).json({ error: 'Subject not found' });
    res.json(updatedSubject);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// @route   DELETE /api/subjects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedSubject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedSubject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;