import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    default: 1,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: [v => Array.isArray(v) && v.length > 0, 'Order must contain at least one item'],
  },
  channel: {
    type: String,
    required: true,
    default: 'in-store',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create requested indexes
orderSchema.index({ customerId: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
