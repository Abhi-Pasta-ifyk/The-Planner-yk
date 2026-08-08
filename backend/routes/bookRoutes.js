const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate', async (req, res) => {
  try {
    const { bookName } = req.body;
    if (!bookName) {
      return res.status(400).json({ message: "Book name is required" });
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const prompt = `Generate a syllabus/table of contents for the book or subject: "${bookName}". 
    Return ONLY a raw JSON object (no markdown, no backticks) with this exact structure:
    {
      "title": "Full Book Title",
      "author": "Author Name or Governing Body",
      "pages": 300,
      "chapters": ["Chapter 1 Name", "Chapter 2 Name", "Chapter 3 Name"]
    }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Strip out markdown formatting in case the AI adds it
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const bookData = JSON.parse(cleanJson);

    res.json(bookData);

  } catch (error) {
    console.error("Smart Syllabus Error Detail:", error.message);
    
    // Catch the specific 503 High Demand Error from Google
    if (error.status === 503 || error.message.includes('503')) {
      return res.status(503).json({ 
        message: "The AI is currently experiencing high global demand. Please wait 10 seconds and try again." 
      });
    }

    // Catch formatting or other general errors
    res.status(500).json({ message: "Failed to generate syllabus. Please try again." });
  }
});

module.exports = router;