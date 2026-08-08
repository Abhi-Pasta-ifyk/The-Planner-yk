const express = require('express');
const router = express.Router();
const Cheer = require('../models/Cheer');
const { protect: auth } = require('../middleware/authMiddleware');

// @route   GET /api/cheer
// @desc    Get the user's cheer stats
router.get('/', auth, async (req, res) => {
  try {
    let cheerData = await Cheer.findOne({ user: req.user.id });
    if (!cheerData) {
      cheerData = await Cheer.create({ user: req.user.id, totalCheers: 0 });
    }
    res.json(cheerData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/cheer
// @desc    Increment the cheer counter by 1
router.post('/', auth, async (req, res) => {
  try {
    const updatedCheer = await Cheer.findOneAndUpdate(
      { user: req.user.id },
      { 
        $inc: { totalCheers: 1 },
        $set: { lastCheerDate: Date.now() }
      },
      { returnDocument: 'after', upsert: true }
    );
    res.json(updatedCheer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;