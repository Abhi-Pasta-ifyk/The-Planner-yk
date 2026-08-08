const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String },
  diff: { type: String },
  status: { type: String, default: 'Pending' }
});

const bookSchema = new mongoose.Schema({
  id: { type: Number },
  title: { type: String },
  author: { type: String },
  pages: { type: Number },
  chapters: [chapterSchema]
});

const subjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  color: { type: String },
  textColor: { type: String },
  priority: { type: String },
  hours: { type: Number, default: 0 },
  books: [bookSchema]
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);