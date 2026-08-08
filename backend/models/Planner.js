const mongoose = require('mongoose');

const plannerSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  subject: { 
    type: String, 
    required: true 
  },
  topic: { 
    type: String, 
    required: true 
  },
  subtext: { 
    type: String 
  },
  studiedDate: { 
    type: String, 
    required: true 
  },
  confidenceLevel: { 
    type: String, 
    enum: ['Mastered', 'Good', 'Needs Review'], 
    default: 'Needs Review' 
  },
  rev1: { 
    date: String, 
    done: { type: Boolean, default: false } 
  },
  rev2: { 
    date: String, 
    done: { type: Boolean, default: false } 
  },
  rev3: { 
    date: String, 
    done: { type: Boolean, default: false } 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Planner', plannerSchema);