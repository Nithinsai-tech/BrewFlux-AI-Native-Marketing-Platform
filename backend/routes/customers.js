import express from 'express';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

const router = express.Router();

// Get all customers with optional filtering & pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, city, tag, minSpend, maxSpend, lastOrderDays } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (city) {
      query.city = city;
    }

    if (tag) {
      query.tags = tag;
    }

    if (minSpend || maxSpend) {
      query.totalSpend = {};
      if (minSpend) query.totalSpend.$gte = parseFloat(minSpend);
      if (maxSpend) query.totalSpend.$lte = parseFloat(maxSpend);
    }

    if (lastOrderDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(lastOrderDays));
      query.lastOrderDate = { $gte: cutoffDate };
    }

    const customers = await Customer.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ totalSpend: -1 });

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer count
router.get('/count', async (req, res) => {
  try {
    const count = await Customer.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer details + their orders
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const orders = await Order.find({ customerId: customer._id }).sort({ createdAt: -1 });
    res.json({ customer, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk ingest customers
router.post('/ingest', async (req, res) => {
  try {
    const data = req.body;
    const customers = Array.isArray(data) ? data : [data];
    
    if (customers.length === 0) {
      return res.status(400).json({ error: 'No customer data provided.' });
    }

    const results = [];
    for (const custData of customers) {
      const { name, email, phone, city, tags, totalSpend, totalOrders, lastOrderDate } = custData;
      if (!name || !email || !phone || !city) {
        results.push({ email: email || 'unknown', success: false, error: 'Missing required fields (name, email, phone, city)' });
        continue;
      }

      const formattedEmail = email.toLowerCase().trim();
      const customerDoc = {
        name: name.trim(),
        email: formattedEmail,
        phone: phone.trim(),
        city: city.trim(),
        tags: Array.isArray(tags) ? tags : [],
        totalSpend: typeof totalSpend === 'number' ? totalSpend : 0,
        totalOrders: typeof totalOrders === 'number' ? totalOrders : 0,
        lastOrderDate: lastOrderDate ? new Date(lastOrderDate) : undefined
      };

      const customer = await Customer.findOneAndUpdate(
        { email: formattedEmail },
        customerDoc,
        { upsert: true, new: true }
      );
      results.push({ email: formattedEmail, success: true, id: customer._id });
    }

    res.json({
      message: `Processed ${customers.length} customer records.`,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk ingest orders
router.post('/ingest-orders', async (req, res) => {
  try {
    const data = req.body;
    const orders = Array.isArray(data) ? data : [data];

    if (orders.length === 0) {
      return res.status(400).json({ error: 'No order data provided.' });
    }

    const results = [];
    for (const orderData of orders) {
      const { customerId, email, amount, items, channel, createdAt } = orderData;
      if ((!customerId && !email) || !amount || !items || !Array.isArray(items) || items.length === 0) {
        results.push({ success: false, error: 'Missing required fields (customerId or email, amount, and items array)' });
        continue;
      }

      // Find customer
      let customer;
      if (customerId) {
        customer = await Customer.findById(customerId);
      } else if (email) {
        customer = await Customer.findOne({ email: email.toLowerCase().trim() });
      }

      if (!customer) {
        results.push({ email: email || 'unknown', success: false, error: 'Customer not found matching email/customerId' });
        continue;
      }

      const orderDate = createdAt ? new Date(createdAt) : new Date();
      const order = new Order({
        customerId: customer._id,
        amount: parseFloat(amount),
        items,
        channel: channel || 'in-store',
        createdAt: orderDate
      });

      await order.save();

      // Update customer stats
      customer.totalOrders += 1;
      customer.totalSpend += parseFloat(amount);
      if (!customer.lastOrderDate || new Date(customer.lastOrderDate) < orderDate) {
        customer.lastOrderDate = orderDate;
      }
      await customer.save();

      results.push({ orderId: order._id, customerId: customer._id, success: true });
    }

    res.json({
      message: `Processed ${orders.length} order records.`,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

