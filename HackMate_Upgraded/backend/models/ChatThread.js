const mongoose = require('mongoose');
const ChatThreadSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isGroup: { type: Boolean, default: false },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  lastMessageAt: Date,
}, { timestamps: true });
module.exports = mongoose.model('ChatThread', ChatThreadSchema);
