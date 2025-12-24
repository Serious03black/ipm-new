// models/DemoRequest.js
const mongoose = require('mongoose');

const demoRequestSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    match: /^[6-9]\d{9}$/, // 10 digits starting with 6-9
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DemoRequest', demoRequestSchema);