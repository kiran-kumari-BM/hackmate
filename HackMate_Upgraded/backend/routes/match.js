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

// simple matches: shared interests
router.get('/simple', auth, async (req, res) => {
  const me = await User.findById(req.userId);
  if (!me) return res.status(404).json({ message: 'User not found' });
  const matches = await User.find({ _id: { $ne: me._id }, interests: { $in: me.interests } }).select('name college interests skills region mode');
  res.json(matches);
});

// ai-enhanced matches: score by overlap + complementary skills (basic cosine-like)
router.get('/ai', auth, async (req, res) => {
  const me = await User.findById(req.userId);
  if (!me) return res.status(404).json({ message: 'User not found' });
  const others = await User.find({ _id: { $ne: me._id } });
  // build simple vector sets
  const meSet = new Set([...(me.interests||[]), ...(me.skills||[])]);
  function scoreUser(u) {
    const uSet = new Set([...(u.interests||[]), ...(u.skills||[])]);
    let intersect = 0;
    uSet.forEach(x => { if (meSet.has(x)) intersect++; });
    const union = new Set([...meSet, ...uSet]).size;
    const similarity = union === 0 ? 0 : intersect / union;
    // complementary bonus: difference in skills count (encourage complementary with some overlap)
    const compBonus = Math.abs((me.skills||[]).length - (u.skills||[]).length) > 0 ? 0.1 : 0;
    return { user: u, score: similarity + compBonus };
  }
  const scored = others.map(scoreUser).sort((a,b)=>b.score-a.score).slice(0,50);
  res.json(scored.map(s => ({ user: { id: s.user._id, name: s.user.name, interests: s.user.interests, skills: s.user.skills }, score: s.score })));
});

module.exports = router;
