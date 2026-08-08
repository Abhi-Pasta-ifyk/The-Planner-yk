const express = require('express');
const router = express.Router();
const MonthlyRecord = require('../models/MonthlyRecord');
const { protect: auth } = require('../middleware/authMiddleware');

// @route   GET /api/monthly-records
// @desc    Get ALL monthly records for the user (Used for Analytics)
router.get('/', auth, async (req, res) => {
  try {
    const records = await MonthlyRecord.find({ user: req.user.id });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/monthly-records/:monthKey
router.get('/:monthKey', auth, async (req, res) => {
  try {
    let record = await MonthlyRecord.findOne({ user: req.user.id, monthKey: req.params.monthKey });
    
    // If no record exists for this month yet, return an empty default payload
    if (!record) {
      return res.json({ studiedDays: [], notes: {} });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PUT /api/monthly-records/:monthKey
router.put('/:monthKey', auth, async (req, res) => {
  try {
    const { studiedDays, notes } = req.body;
    
    // findOneAndUpdate with upsert: true will create it if it doesn't exist yet!
    const updatedRecord = await MonthlyRecord.findOneAndUpdate(
      { user: req.user.id, monthKey: req.params.monthKey },
      { $set: { studiedDays, notes } },
      { returnDocument: 'after', upsert: true } // FIXED DEPRECATION WARNING
    );
    
    res.json(updatedRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;