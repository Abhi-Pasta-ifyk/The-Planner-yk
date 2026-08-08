require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const axios = require('axios'); // Required for fetching GitHub PDFs seamlessly
const https = require('https'); // Required for NCERT raw socket fallback

const app = express();

// ==========================================
// 🛡️ SECURITY & STANDARD MIDDLEWARE
// ==========================================

// 1. Set secure HTTP headers (Blocks XSS, Clickjacking, etc.)
app.use(helmet());

// 2. Configure strict CORS (Only allows your specific frontend to connect)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-production-url.com' : 'http://localhost:5173',
  credentials: true
}));

// 3. Parses incoming JSON requests
app.use(express.json()); 

// 3.5 Parses incoming cookies!
app.use(cookieParser());

// 4. General Rate limiting (Prevents brute-force and DDoS on your overall API)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter); 

// 5. Strict Rate limiting for AI routes (Protects your Gemini API key bill)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 AI generations per hour
  message: 'AI generation limit reached. Please try again in an hour.'
});
app.use('/api/ai', aiLimiter);
app.use('/api/books/generate', aiLimiter);

// ==========================================
// 📄 HYBRID PDF PROXY ROUTE (NCERT + GITHUB)
// ==========================================
app.get('/api/proxy/pdf', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ message: "Missing URL" });
  }

  // 1. ALLOW LIST: Permit NCERT or GitHub links
  if (!url.includes('ncert.nic.in') && !url.includes('github')) {
    return res.status(400).json({ message: "Only NCERT and GitHub URLs are allowed." });
  }

  // 2. GITHUB HANDLER: Direct streaming via Axios
  if (url.includes('github')) {
    try {
      // Auto-convert standard github web links into "raw" download links
      let fetchUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      
      const response = await axios({
        method: 'GET',
        url: fetchUrl,
        responseType: 'stream'
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="chapter.pdf"');
      return response.data.pipe(res);
    } catch (error) {
       console.error("GitHub Fetch Error:", error.message);
       return res.status(500).json({ message: "Failed to fetch PDF from GitHub." });
    }
  }

  // 3. NCERT HANDLER: Native HTTPS socket bypass
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://ncert.nic.in/',
      'Accept': 'application/pdf'
    },
    rejectUnauthorized: false, 
    family: 4                  
  };

  https.get(url, options, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      return res.status(proxyRes.statusCode).json({ message: `NCERT server rejected with status ${proxyRes.statusCode}` });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="chapter.pdf"');
    proxyRes.pipe(res);
  }).on('error', (error) => {
    console.error("Native PDF Proxy Error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to fetch PDF from NCERT." });
    }
  });
});

// ==========================================
// ROUTES
// ==========================================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes')); 
app.use('/api/subjects', require('./routes/subjectRoutes')); 
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/monthly-records', require('./routes/monthlyRecordRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/daily-records', require('./routes/dailyRecordRoutes'));
app.use('/api/habits', require('./routes/habitRoutes'));
app.use('/api/planner', require('./routes/plannerRoutes'));
app.use('/api/cheer', require('./routes/cheerRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/books', require('./routes/bookRoutes')); 

// ==========================================
// DATABASE CONNECTION & SERVER INIT
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connection established securely.'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});