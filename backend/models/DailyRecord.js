const mongoose = require('mongoose');

const scheduleBlockSchema = new mongoose.Schema({
  id: { type: String }, // Frontend ID to keep track of blocks
  time: { type: String, default: '' },
  task: { type: String, default: '' }
});

const dailyRecordSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  dateKey: { 
    type: String, 
    required: true // Format: "YYYY-MM-DD"
  },
  schedule: [scheduleBlockSchema],
  notes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyRecord', dailyRecordSchema);