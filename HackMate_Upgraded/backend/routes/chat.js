const express = require('express');
const router = express.Router();
const ChatThread = require('../models/ChatThread');
const Message = require('../models/Message');
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

// create or fetch 1:1
router.post('/thread', auth, async (req, res) => {
  const { otherUserId } = req.body;
  if (!otherUserId) return res.status(400).json({ message: 'otherUserId required' });
  let thread = await ChatThread.findOne({ isGroup: false, members: { $all: [req.userId, otherUserId], $size: 2 } });
  if (!thread) {
    thread = new ChatThread({ members: [req.userId, otherUserId], isGroup: false });
    await thread.save();
  }
  res.json(thread);
});

// post message
router.post('/message', auth, async (req, res) => {
  const { threadId, content, attachments } = req.body;
  if (!threadId) return res.status(400).json({ message: 'threadId required' });
  const message = new Message({ thread: threadId, sender: req.userId, content, attachments });
  await message.save();
  await ChatThread.findByIdAndUpdate(threadId, { lastMessageAt: new Date() });
  res.json(message);
});

router.get('/messages/:threadId', auth, async (req, res) => {
  const { threadId } = req.params;
  const messages = await Message.find({ thread: threadId }).sort({ createdAt: -1 }).limit(50);
  res.json(messages.reverse());
});

module.exports = router;
