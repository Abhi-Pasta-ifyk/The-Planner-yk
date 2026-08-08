const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const PlannerItem = require('../models/PlannerItem');
const Task = require('../models/Task'); // <-- The missing link!
const { protect: auth } = require('../middleware/authMiddleware');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST /api/ai/sync
// @desc    Process natural language to update or add tasks across all Planner databases
router.post('/sync', auth, async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: "Command text is required." });
    }

    // 1. Fetch active revision tasks for context
    const activeTasks = await PlannerItem.find({ user: req.user.id });
    const tasksContext = activeTasks.map(t => ({
      id: t._id.toString(),
      topic: t.topic,
      subject: t.subject,
      rev1: t.rev1,
      rev2: t.rev2,
      rev3: t.rev3
    }));

    // 2. Build the Multi-Database Prompt
    const prompt = `
      You are a master scheduling assistant. Today is ${new Date().toDateString()} (Year: ${new Date().getFullYear()}).
      
      The user has TWO different databases for their planner:
      1. "Revision Database" (Long-term subjects/topics). Dates MUST use "MMM D" (e.g., "Jul 28").
      2. "General Task Database" (Weekly/Daily to-do lists). Dates MUST use strict "YYYY-MM-DD" format (e.g., "2026-07-28").

      Here is the user's current Revision schedule:
      ${JSON.stringify(tasksContext)}
      
      User command: "${command}"
      
      Analyze the command and return a raw JSON object matching this structure (no markdown formatting):
      {
        "revisionUpdates": [
          {
            "taskId": "exact string id from context",
            "revField": "rev1", 
            "newDate": "Jul 28", 
            "markDone": true or false
          }
        ],
        "revisionCreations": [
          {
            "subject": "Subject Name",
            "topic": "Topic Description",
            "date": "Jul 28"
          }
        ],
        "generalTaskCreations": [
          {
            "text": "Task Description (e.g., Study Polity chapter 1)",
            "date": "2026-07-28" 
          }
        ]
      }
      
      CRITICAL INSTRUCTION: If the user simply says "Add a task for [Topic] on [Date]", put it in BOTH "revisionCreations" AND "generalTaskCreations" so it shows up on all their planner screens! Ensure dates follow the exact formats specified.
    `;

    // 3. Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent(prompt);
    let aiResponse = result.response.text().trim();
    
    console.log("--- RAW AI RESPONSE ---");
    console.log(aiResponse);

    // Clean Markdown
    aiResponse = aiResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

    const parsedResult = JSON.parse(aiResponse);
    const revisionUpdates = parsedResult.revisionUpdates || [];
    const revisionCreations = parsedResult.revisionCreations || [];
    const generalTaskCreations = parsedResult.generalTaskCreations || [];

    let modifiedCount = 0;

    // 4. Process Revision Updates (PlannerItem)
    for (const update of revisionUpdates) {
      if (!update.taskId || update.taskId === "exact string id from context") continue; 
      
      const task = await PlannerItem.findOne({ _id: update.taskId, user: req.user.id });
      if (task && update.revField) {
        const currentRev = task[update.revField] || { date: '', done: false };
        const updatedRevField = {
          date: update.newDate ? update.newDate : currentRev.date,
          done: update.markDone !== undefined && update.markDone !== null ? update.markDone : currentRev.done
        };

        await PlannerItem.findByIdAndUpdate(
          update.taskId,
          { $set: { [update.revField]: updatedRevField } },
          { new: true }
        );
        modifiedCount++;
      }
    }

    // 5. Process Revision Creations (PlannerItem - Spaced Repetitions)
    for (const creation of revisionCreations) {
      if (creation.subject && creation.topic && creation.subject !== "Subject Name") {
        await PlannerItem.create({
          user: req.user.id,
          subject: creation.subject,
          topic: creation.topic,
          studiedDate: creation.date || new Date().toISOString().split('T')[0],
          rev1: { date: creation.date || "Jul 28", done: false },
          rev2: { date: "", done: false },
          rev3: { date: "", done: false }
        });
        modifiedCount++;
      }
    }

    // 6. Process General Task Creations (Task - Weekly/Daily Planners)
    for (const gTask of generalTaskCreations) {
      if (gTask.text && gTask.date) {
        await Task.create({
          user: req.user.id,
          text: gTask.text,
          date: gTask.date, // AI is instructed to output YYYY-MM-DD
          status: 'Pending'
        });
        modifiedCount++;
      }
    }

    res.json({ message: "Schedules updated successfully!", updatedCount: modifiedCount });

  } catch (err) {
    console.error("AI Sync Error Detail:", err);
    res.status(500).json({ error: "Failed to process AI command. Check backend console." });
  }
});

module.exports = router;