import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import Communication from '../models/Communication.js';
import { buildMongoQuery } from '../tools/query_customers.js';
import { personalizeMessage } from '../tools/preview_campaign.js';

const router = express.Router();

// GET /api/campaigns
// Return all campaigns with their stats, sorted by createdAt desc, populating segmentId with segment name
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate('segmentId', 'name')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/campaigns/:id
// Return details of a specific campaign by id
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('segmentId', 'name');
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns
// Create draft campaign: { name, segmentId, channel, messageTemplate }
router.post('/', async (req, res) => {
  try {
    const { name, segmentId, channel, messageTemplate } = req.body;

    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const campaign = new Campaign({
      name,
      segmentId,
      channel,
      messageTemplate,
      status: 'draft',
      stats: {
        total: segment.customerCount || 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
        read: 0,
        clicked: 0,
        converted: 0,
      },
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/campaigns/:id
// Update campaign details (e.g. messageTemplate, name)
router.put('/:id', async (req, res) => {
  try {
    const { name, messageTemplate } = req.body;
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft campaigns can be edited' });
    }
    if (name) campaign.name = name;
    if (messageTemplate) campaign.messageTemplate = messageTemplate;
    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/campaigns/:id/launch
router.post('/:id/launch', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Campaign is not in draft status' });
    }

    const segment = await Segment.findById(campaign.segmentId);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Build MongoDB query from segment rules & fetch matching customers
    const mongoQuery = buildMongoQuery(segment.rules);
    const customers = await Customer.find(mongoQuery).lean();
    const totalCount = customers.length;

    // Update Campaign status to running and store total audience size
    campaign.status = 'running';
    campaign.stats.total = totalCount;
    await campaign.save();

    // Broadcast status change immediately to clients
    const io = req.app.get('io');
    if (io) {
      io.emit('campaign_status_change', {
        campaignId: campaign._id,
        status: 'running',
      });
    }

    if (totalCount === 0) {
      return res.json({ campaignId: campaign._id, totalQueued: 0 });
    }

    // Create queued Communication documents
    const commDocs = customers.map((cust) => ({
      campaignId: campaign._id,
      customerId: cust._id,
      message: personalizeMessage(campaign.messageTemplate, cust),
      status: 'queued',
    }));
    const insertedComms = await Communication.insertMany(commDocs);

    // Asynchronously call channel service POST /simulate in batches of 10 using Promise.allSettled
    const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://channel-service:4000';
    const callbackUrl = process.env.CRM_CALLBACK_URL || 'http://backend:3000/api/receipt';

    setImmediate(async () => {
      const batchSize = 10;
      for (let i = 0; i < insertedComms.length; i += batchSize) {
        const batch = insertedComms.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(async (comm) => {
            await axios.post(`${channelServiceUrl}/send`, {
              campaignId: campaign._id,
              customerId: comm.customerId,
              channel: campaign.channel,
              message: comm.message,
            });
          })
        );
      }
    });

    // Return immediately
    res.json({ campaignId: campaign._id, totalQueued: totalCount });
  } catch (error) {
    console.error('[Launch Campaign Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/campaigns/:id/stats
// Return aggregated stats, rates, and minute-by-minute timeline aggregation
router.get('/:id/stats', async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaignObjectId = new mongoose.Types.ObjectId(campaignId);

    // Group communications by status
    const statusGroups = await Communication.aggregate([
      { $match: { campaignId: campaignObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const counts = {
      queued: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      read: 0,
      clicked: 0,
      converted: 0,
    };

    statusGroups.forEach((item) => {
      counts[item._id] = item.count;
    });

    // Compute cumulative counts
    const totalSent = counts.sent + counts.delivered + counts.read + counts.opened + counts.clicked + counts.converted;
    const totalDelivered = counts.delivered + counts.read + counts.opened + counts.clicked + counts.converted;
    const totalOpened = counts.opened + counts.clicked + counts.converted;
    const totalClicked = counts.clicked + counts.converted;
    const totalConverted = counts.converted;

    // Rates calculation
    const total = campaign.stats.total || totalSent || 1;
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) : 0;
    const convertRate = totalClicked > 0 ? (totalConverted / totalClicked) : 0;

    // Group communications by minute using updatedAt
    const timeline = await Communication.aggregate([
      { $match: { campaignId: campaignObjectId } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%dT%H:%M:00.000Z', date: '$updatedAt' },
          },
          delivered: {
            $sum: {
              $cond: [{ $in: ['$status', ['delivered', 'read', 'opened', 'clicked', 'converted']] }, 1, 0],
            },
          },
          opened: {
            $sum: {
              $cond: [{ $in: ['$status', ['opened', 'clicked', 'converted']] }, 1, 0],
            },
          },
          clicked: {
            $sum: {
              $cond: [{ $in: ['$status', ['clicked', 'converted']] }, 1, 0],
            },
          },
        },
      },
      { $project: { minute: '$_id', _id: 0, delivered: 1, opened: 1, clicked: 1 } },
      { $sort: { minute: 1 } },
    ]);

    const fullStats = {
      campaignId: campaign._id,
      campaignName: campaign.name,
      stats: {
        total,
        sent: totalSent,
        delivered: totalDelivered,
        failed: counts.failed,
        opened: totalOpened,
        read: counts.read + counts.opened + counts.clicked + counts.converted,
        clicked: totalClicked,
        converted: totalConverted,
      },
      rates: {
        deliveryRate: Math.round(deliveryRate * 1000) / 10,
        openRate: Math.round(openRate * 1000) / 10,
        clickRate: Math.round(clickRate * 1000) / 10,
        convertRate: Math.round(convertRate * 1000) / 10,
      },
      timeline,
    };

    res.json(fullStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/campaigns/:id/communications
router.get('/:id/communications', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const campaignId = req.params.id;

    const query = { campaignId };
    
    if (status && status !== 'all') {
      if (status === 'delivered') {
        query.status = { $in: ['delivered', 'read', 'opened', 'clicked', 'converted'] };
      } else if (status === 'opened') {
        query.status = { $in: ['opened', 'clicked', 'converted'] };
      } else if (status === 'clicked') {
        query.status = { $in: ['clicked', 'converted'] };
      } else {
        query.status = status;
      }
    }

    const communications = await Communication.find(query)
      .populate('customerId', 'name')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Communication.countDocuments(query);

    res.json({
      communications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
