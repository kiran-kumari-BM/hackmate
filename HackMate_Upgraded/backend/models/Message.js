const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  attachments: [String],
}, { timestamps: true });
module.exports = mongoose.model('Message', MessageSchema);
