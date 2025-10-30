const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const ChatThread = require('../models/ChatThread');

// simple auth middleware reused from profile route via require in production
const jwt = require('jsonwebtoken');
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

router.post('/', auth, async (req, res) => {
  try {
    const { name, members = [], interests = [], hackathonEvent } = req.body;
    const team = new Team({ name, members: [req.userId, ...members], interests, createdBy: req.userId, hackathonEvent });
    await team.save();
    const thread = new ChatThread({ members: team.members, isGroup: true, team: team._id, lastMessageAt: new Date() });
    await thread.save();
    res.json({ team, thread });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Team creation failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  const teams = await Team.find({ members: req.userId }).populate('members', 'name email');
  res.json(teams);
});

module.exports = router;
