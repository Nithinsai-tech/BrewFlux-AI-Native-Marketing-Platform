import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  segmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Segment',
    required: true,
  },
  channel: {
    type: String,
    enum: ['whatsapp', 'sms', 'email', 'rcs'],
    required: true,
  },
  messageTemplate: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'completed'],
    default: 'draft',
  },
  stats: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
