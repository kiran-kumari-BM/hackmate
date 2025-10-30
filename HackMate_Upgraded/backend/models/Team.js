const mongoose = require('mongoose');
const TeamSchema = new mongoose.Schema({
  name: { type: String, default: 'Untitled Team' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  interests: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Team', TeamSchema);
