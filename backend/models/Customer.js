import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  totalSpend: {
    type: Number,
    default: 0,
  },
  lastOrderDate: {
    type: Date,
  },
  tags: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create requested indexes
customerSchema.index({ city: 1 });
customerSchema.index({ totalSpend: -1 });
customerSchema.index({ lastOrderDate: -1 });
customerSchema.index({ tags: 1 });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
