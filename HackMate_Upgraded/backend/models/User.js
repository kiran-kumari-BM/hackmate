const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password_hash: String,
  college: String,
  current_year: Number,
  graduation_year: Number,
  mode: String,
  state: String,
  region: String,
  interests: [String],
  skills: [String],
  languages: [String],
  hackathons_participated: Number,
  hackathons_won: Number,
  connections: [String]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
