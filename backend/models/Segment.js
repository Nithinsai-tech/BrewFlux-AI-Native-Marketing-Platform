import mongoose from 'mongoose';

const conditionSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true,
  },
  operator: {
    type: String,
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, { _id: false });

const segmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  rules: {
    operator: {
      type: String,
      enum: ['AND', 'OR'],
      required: true,
      default: 'AND',
    },
    conditions: {
      type: [conditionSchema],
      required: true,
      validate: [v => Array.isArray(v) && v.length > 0, 'Segment rules must contain at least one condition'],
    },
  },
  customerCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Segment = mongoose.model('Segment', segmentSchema);
export default Segment;
