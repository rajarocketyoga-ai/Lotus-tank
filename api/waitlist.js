const fs = require('fs');
const path = require('path');

// Simple file-based waitlist store (works on Vercel's serverless read-only filesystem with /tmp)
const DATA_FILE = '/tmp/waitlist.json';

function readWaitlist() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { return []; }
}

function writeWaitlist(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const waitlist = readWaitlist();
    const existing = waitlist.find(e => e.email === cleanEmail);
    if (existing) {
      return res.status(200).json({ success: true, message: "You're already on the list! 🧘", duplicate: true });
    }

    waitlist.push({ email: cleanEmail, date: new Date().toISOString(), source: 'website-waitlist', subscribed: true });
    writeWaitlist(waitlist);

    return res.status(201).json({
      success: true,
      message: "You're on the list! We'll let you know when we launch. 🧘",
      total: waitlist.length
    });
  }

  if (req.method === 'GET') {
    const waitlist = readWaitlist();
    return res.json({ success: true, count: waitlist.length });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};
