const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  timeframe: { 
    type: String, 
    enum: ['Annual', 'Monthly'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Achieved'], 
    default: 'Pending' 
  },
  // We can use this to store specific years (e.g., "2025") or months (e.g., "August")
  period: { 
    type: String 
  } 
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);