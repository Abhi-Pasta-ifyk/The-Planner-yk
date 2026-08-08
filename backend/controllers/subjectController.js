const Subject = require('../models/Subject');

// @desc    Get user subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res) => {
  try {
    // Only fetch subjects that belong to the logged-in user
    const subjects = await Subject.find({ user: req.user.id });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res) => {
  try {
    const { name, color, textColor, priority, books } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a subject name' });
    }

    // Create the subject and link it to the user's ID
    const subject = await Subject.create({
      name,
      color,
      textColor,
      priority,
      books: books || [],
      user: req.user.id
    });

    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Security Check: Ensure the logged-in user matches the subject's owner
    if (subject.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this data' });
    }

    await subject.deleteOne();
    res.status(200).json({ id: req.params.id, message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  deleteSubject
};