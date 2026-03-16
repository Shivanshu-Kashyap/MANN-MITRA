const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  risk_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user_id: {
    type: String,
    default: null,
    index: true,
  },
  messages: [chatMessageSchema],
  risk_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true,
  },
  risk_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  risk_summary: {
    type: String,
    default: '',
  },
  mood_scores: {
    type: [Number],
    default: [],
  },
  interaction_count: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false,
  collection: 'chat_sessions',
});

chatSessionSchema.index({ updated_at: -1 });
chatSessionSchema.index({ risk_level: 1, updated_at: -1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
