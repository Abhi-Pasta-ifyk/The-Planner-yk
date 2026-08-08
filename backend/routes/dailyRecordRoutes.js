const express = require('express');
const router = express.Router();
const DailyRecord = require('../models/DailyRecord');
const { protect: auth } = require('../middleware/authMiddleware');

// @route   GET /api/daily-records/:dateKey
router.get('/:dateKey', auth, async (req, res) => {
  try {
    let record = await DailyRecord.findOne({ user: req.user.id, dateKey: req.params.dateKey });
    
    // Default empty state if no record exists for this day
    if (!record) {
      return res.json({ schedule: [], notes: '' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PUT /api/daily-records/:dateKey
router.put('/:dateKey', auth, async (req, res) => {
  try {
    const { schedule, notes } = req.body;
    
    // Update or create if it doesn't exist (upsert)
    const updatedRecord = await DailyRecord.findOneAndUpdate(
      { user: req.user.id, dateKey: req.params.dateKey },
      { $set: { schedule, notes } },
      { returnDocument: 'after', upsert: true } // Safe from deprecation warnings!
    );
    
    res.json(updatedRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;