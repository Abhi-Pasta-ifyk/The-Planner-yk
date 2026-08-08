const mongoose = require('mongoose');

const cheerSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  totalCheers: { 
    type: Number, 
    default: 0 
  },
  lastCheerDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Cheer', cheerSchema);