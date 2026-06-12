import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'failed', 'opened', 'read', 'clicked', 'converted'],
    default: 'queued',
  },
  sentAt: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
  openedAt: {
    type: Date,
  },
  readAt: {
    type: Date,
  },
  clickedAt: {
    type: Date,
  },
  convertedAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before save
communicationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes
communicationSchema.index({ campaignId: 1 });
communicationSchema.index({ status: 1 });

const Communication = mongoose.model('Communication', communicationSchema);
export default Communication;
