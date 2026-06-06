/* =============================================
   LotusTank — Waitlist Backend Server
   Express API + Static File Server
   ============================================= */

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuration ---
const DATA_DIR = path.join(__dirname, '..', 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');
const SITE_DIR = path.join(__dirname, '..');

// Ensure data directory and waitlist file exist
function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(WAITLIST_FILE)) {
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read waitlist from file
function readWaitlist() {
  try {
    const data = fs.readFileSync(WAITLIST_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Write waitlist to file
function writeWaitlist(entries) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Initialize
ensureDataStore();

// --- Middleware ---
app.use(cors({
  origin: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static File Serving (the LotusTank website) ---
app.use(express.static(SITE_DIR, {
  index: 'index.html',
  extensions: ['html', 'htm'],
  setHeaders: (res, filePath) => {
    // Cache static assets for better performance
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// =============================================
// API ROUTES
// =============================================

/**
 * POST /api/waitlist
 * Join the launch waitlist
 * Body: { email: string }
 * Returns: { success: boolean, message: string }
 */
app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;

  // Validate email presence
  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email address.'
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Validate email format
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  // Read current waitlist
  const waitlist = readWaitlist();

  // Check for duplicates
  const existing = waitlist.find(entry => entry.email === cleanEmail);
  if (existing) {
    return res.status(200).json({
      success: true,
      message: "You're already on the list! We'll be in touch soon. 🧘",
      duplicate: true
    });
  }

  // Add new entry
  const entry = {
    email: cleanEmail,
    date: new Date().toISOString(),
    source: 'website-waitlist',
    subscribed: true
  };

  waitlist.push(entry);
  writeWaitlist(waitlist);

  console.log(`📧 New waitlist signup: ${cleanEmail} (total: ${waitlist.length})`);

  return res.status(201).json({
    success: true,
    message: "You're on the list! We'll let you know when we launch. 🧘",
    total: waitlist.length
  });
});

/**
 * GET /api/waitlist/count
 * Returns the total number of waitlist signups (useful for social proof display)
 */
app.get('/api/waitlist/count', (req, res) => {
  const waitlist = readWaitlist();
  return res.json({
    success: true,
    count: waitlist.length
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'lotustank-waitlist',
    uptime: process.uptime()
  });
});

// --- Fallback to index.html for SPA-like routes ---
app.get('*', (req, res) => {
  res.sendFile(path.join(SITE_DIR, 'index.html'));
});

// --- Error handling middleware ---
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.'
  });
});

// --- Start server (only for local dev) ---
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🧘 LotusTank server running!`);
    console.log(`   🌐 Website: http://0.0.0.0:${PORT}`);
    console.log(`   📧 API:     http://0.0.0.0:${PORT}/api/waitlist`);
    console.log(`   📊 Count:   http://0.0.0.0:${PORT}/api/waitlist/count`);
    console.log(`   💚 Health:  http://0.0.0.0:${PORT}/api/health\n`);
  });
}

// Export for Vercel serverless
module.exports = app;