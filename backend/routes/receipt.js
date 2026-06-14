import express from 'express';
import Campaign from '../models/Campaign.js';
import Communication from '../models/Communication.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { clearInsightsCache } from './insights.js';

const router = express.Router();

const statusOrder = [
  'queued',
  'sent',
  'delivered',
  'read',
  'opened',
  'clicked',
  'converted',
  'failed'
];

// Handles POST /api/receipt (or POST /api/receipts/callback)
const handleReceipt = async (req, res) => {
  const { communicationId, status, timestamp, campaignId, customerId } = req.body;

  if (!status || (!communicationId && !(campaignId && customerId))) {
    return res.status(400).json({ error: 'Either communicationId or both campaignId and customerId are required, along with status.' });
  }

  try {
    const comm = communicationId
      ? await Communication.findById(communicationId)
      : await Communication.findOne({ campaignId, customerId });
    if (!comm) {
      return res.status(404).json({ error: 'Communication log not found' });
    }

    // 1. IDEMPOTENCY: if communication.status === status, return 200 (ignore duplicate)
    if (comm.status === status) {
      return res.status(200).json({ message: 'Duplicate status receipt ignored.' });
    }

    // 2. STATUS ORDER enforcement
    const currentIdx = statusOrder.indexOf(comm.status);
    const newIdx = statusOrder.indexOf(status);

    const isFailed = status === 'failed';
    const isForward = newIdx > currentIdx;
    const allowUpdate = isFailed || isForward;

    if (!allowUpdate) {
      // Out of order update, ignore silently
      return res.status(200).json({ message: 'Out-of-order status receipt ignored silently.' });
    }

    // 3. Return 200 immediately, do DB writes in background using setImmediate
    res.status(200).json({ message: 'Receipt accepted and queued for update.' });

    setImmediate(async () => {
      try {
        // Update Communication status and relevant timestamp field
        comm.status = status;
        
        const updateTime = timestamp ? new Date(timestamp) : new Date();
        if (status === 'sent') comm.sentAt = updateTime;
        if (status === 'delivered') comm.deliveredAt = updateTime;
        if (status === 'opened') comm.openedAt = updateTime;
        if (status === 'read') comm.readAt = updateTime;
        if (status === 'clicked') comm.clickedAt = updateTime;
        if (status === 'converted') comm.convertedAt = updateTime;
        
        await comm.save();

        // Populate customer details
        await comm.populate('customerId', 'name email');
        const customerName = comm.customerId?.name || 'Unknown Customer';

        // If status is converted, create a new order and update customer totals
        if (status === 'converted' && comm.customerId) {
          try {
            const campaign = await Campaign.findById(comm.campaignId);
            const channel = campaign ? campaign.channel : 'whatsapp';
            
            // Randomly select menu item to simulate order items
            const MENU_ITEMS = [
              { name: 'Cold Brew Combo', category: 'Beverage', price: 450, qty: 1 },
              { name: 'Coffee Beans Bag (250g)', category: 'Merchandise', price: 600, qty: 1 },
              { name: 'Nitro Cold Brew & Brownie Set', category: 'Beverage', price: 550, qty: 1 },
              { name: 'French Press & Mug Bundle', category: 'Merchandise', price: 2550, qty: 1 }
            ];
            const orderItem = MENU_ITEMS[Math.floor(Math.random() * MENU_ITEMS.length)];
            const orderAmount = orderItem.price;

            // Create Order
            const newOrder = new Order({
              customerId: comm.customerId._id || comm.customerId,
              amount: orderAmount,
              items: [orderItem],
              channel: channel,
              createdAt: updateTime
            });
            await newOrder.save();

            // Update Customer stats
            const customer = await Customer.findById(comm.customerId._id || comm.customerId);
            if (customer) {
              customer.totalOrders += 1;
              customer.totalSpend += orderAmount;
              if (!customer.lastOrderDate || new Date(customer.lastOrderDate) < updateTime) {
                customer.lastOrderDate = updateTime;
              }
              await customer.save();
              console.log(`[Receipt] Order created on campaign conversion. Customer ${customer.name} updated: totalOrders=${customer.totalOrders}, totalSpend=${customer.totalSpend}`);
            }
          } catch (orderErr) {
            console.error('[Receipt] Error simulating order on conversion:', orderErr);
          }
        }

        // Update Campaign stats atomically using MongoDB $inc
        const incField = `stats.${status}`;
        const updatedCampaign = await Campaign.findByIdAndUpdate(
          comm.campaignId,
          { $inc: { [incField]: 1 } },
          { new: true }
        );

        const updatedStats = updatedCampaign ? updatedCampaign.stats : {};

        // Emit Socket.IO event to room `campaign:${campaignId}`
        const io = req.app.get('io');
        if (io) {
          const roomName = `campaign:${comm.campaignId}`;
          console.log(`[Socket.IO] Broadcasting stat_update to room ${roomName} - status: ${status}`);
          io.to(roomName).emit('stat_update', {
            type: 'stat_update',
            campaignId: comm.campaignId,
            status,
            stats: updatedStats,
          });

          // Also broadcast general update for list routes
          io.emit('communication_update', {
            campaignId: comm.campaignId,
            communicationId: comm._id,
            customerId: comm.customerId?._id || comm.customerId,
            customerName,
            status,
            updatedStats: { stats: updatedStats },
          });
        }
        clearInsightsCache();
      } catch (err) {
        console.error('[Background Receipt Processing Error]:', err);
      }
    });
  } catch (error) {
    console.error('[Receipt Endpoint Error]:', error);
    res.status(500).json({ error: error.message });
  }
};

router.post('/', handleReceipt);
router.post('/callback', handleReceipt);

export default router;
