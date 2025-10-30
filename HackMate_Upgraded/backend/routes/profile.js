const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

function auth(req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'No token' });
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('-password_hash');
  res.json(user);
});

router.post('/me', auth, async (req, res) => {
  try {
    const updates = req.body;
    if (updates.current_year && !updates.graduation_year) {
      const now = new Date();
      const remaining = Math.max(0, (4 - updates.current_year));
      updates.graduation_year = now.getFullYear() + remaining;
    }
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true }).select('-password_hash');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;
