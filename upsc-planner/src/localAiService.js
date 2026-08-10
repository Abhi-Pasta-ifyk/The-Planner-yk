import { GoogleGenerativeAI } from '@google/generative-ai';

export const localAiService = {
  
  _getAI: () => {
    let apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) throw new Error("Missing Gemini API Key. Please add it in the Settings tab.");
    apiKey = apiKey.replace(/['"]/g, '').trim();
    return new GoogleGenerativeAI(apiKey);
  },

  generateSmartSyllabus: async (bookQuery) => {
    try {
      const genAI = localAiService._getAI();
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.6-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `You are a highly accurate academic syllabus extractor. 
      The user is asking for the chapter list of the following book or academic subject: "${bookQuery}".
      
      Return ONLY a valid JSON object matching this exact structure:
      {
        "title": "Full Official Book Title",
        "author": "Author Name or Governing Body",
        "pages": 450,
        "chapters": ["Chapter 1 Name", "Chapter 2 Name", "Chapter 3 Name"]
      }`;

      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error("AI Syllabus Generation Failed:", error);
      throw error;
    }
  },

  // 🚨 UPGRADED: Now handles both Daily To-Dos and Revisions
  processEndOfDayCommand: async (userCommand, dailyTodos, revisions) => {
    try {
      const genAI = localAiService._getAI();
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.6-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const aggressiveness = localStorage.getItem('aiMode') || 'Balanced';

      const prompt = `You are an AI productivity assistant. 
      The user's end-of-day report is: "${userCommand}".
      
      Here is what was on their schedule today:
      1. Daily To-Do List: ${JSON.stringify(dailyTodos)}
      2. Spaced Revisions Due: ${JSON.stringify(revisions)}
      
      The user's auto-scheduling aggressiveness is set to: ${aggressiveness}.

      Analyze their report. Figure out what they completed, and what to-dos they missed or explicitly want moved to tomorrow.
      Return ONLY a valid JSON object with exactly these keys (use the numeric IDs for todos, string IDs for revisions):
      {
        "completedTodoIds": [],
        "completedRevisionIds": [],
        "todosToMoveToTomorrow": [],
        "aiFeedback": "A short, encouraging 2-sentence summary of their day."
      }`;

      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error("AI End of Day Processing Failed:", error);
      throw error;
    }
  }
};