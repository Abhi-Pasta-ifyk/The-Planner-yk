const mongoose = require('mongoose');

// We create a mini-schema for the revision checkpoints
const subItemSchema = new mongoose.Schema({
  date: { type: String, default: '' },
  done: { type: Boolean, default: false }
});

const plannerItemSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
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
    type: String, 
    default: '' 
  },
  studiedDate: { 
    type: String, 
    required: true 
  },
  confidenceLevel: { 
    type: String, 
    enum: ['Needs Review', 'Good', 'Mastered'], 
    default: 'Needs Review' 
  },
  // Embed the mini-schema for the 3 revision dates
  rev1: subItemSchema,
  rev2: subItemSchema,
  rev3: subItemSchema
}, { timestamps: true });

module.exports = mongoose.model('PlannerItem', plannerItemSchema);