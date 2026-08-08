const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  monthKey: { 
    type: String, 
    required: true // e.g., '2026-07'
  },
  name: { 
    type: String, 
    required: true 
  },
  completedDays: { 
    type: [Number], // Array of day numbers e.g. [1, 5, 12]
    default: [] 
  }
}, { timestamps: true });

module.exports = mongoose.model('Habit', habitSchema);