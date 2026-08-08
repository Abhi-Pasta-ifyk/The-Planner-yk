const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    default: '' 
  },
  date: { 
    type: String, 
    required: true // Format: "YYYY-MM-DD"
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed'], 
    default: 'Pending' // The Daily Planner will use this to check things off!
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);