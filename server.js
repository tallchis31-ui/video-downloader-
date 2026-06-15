const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many download requests, please try again later'
});

app.use('/api/download', limiter);

// Routes
app.use('/api', require('./routes/download'));
app.use('/api', require('./routes/info'));

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'An error occurred', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

app.listen(PORT, () => {
  console.log(`🎬 Video Downloader running on http://localhost:${PORT}`);
  console.log(`📊 AdSense ID: ${process.env.GOOGLE_ADSENSE_ID || 'Not configured'}`);
});
