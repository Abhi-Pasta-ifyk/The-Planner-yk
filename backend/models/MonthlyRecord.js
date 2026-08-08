const mongoose = require('mongoose');

const monthlyRecordSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  monthKey: { 
    type: String, 
    required: true // e.g., '2026-07'
  },
  studiedDays: { 
    type: [Number], 
    default: [] 
  },
  notes: { 
    type: Map, 
    of: String, // Mongoose's way to securely store objects like { "1": "Note", "2": "Note" }
    default: {} 
  }
}, { timestamps: true });

module.exports = mongoose.model('MonthlyRecord', monthlyRecordSchema);