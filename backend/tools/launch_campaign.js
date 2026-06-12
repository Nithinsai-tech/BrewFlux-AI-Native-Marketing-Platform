import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import { buildMongoQuery } from './query_customers.js';

export async function launch_campaign({ segmentId, channel, messageTemplate, campaignName }) {
  try {
    // 1. Fetch Segment and matching Customers
    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return { success: false, error: 'Segment not found' };
    }

    const mongoQuery = buildMongoQuery(segment.rules);
    const customers = await Customer.find(mongoQuery).lean();
    const totalCount = customers.length;

    if (totalCount === 0) {
      return { success: false, error: 'No customers found matching segment rules' };
    }

    // 2. Create Campaign document as draft in MongoDB
    const campaign = new Campaign({
      name: campaignName,
      segmentId,
      channel,
      messageTemplate,
      status: 'draft',
      stats: {
        total: totalCount,
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

    // 3. Prepare the first 5 customers for preview
    const previewRecipients = customers.slice(0, 5).map(c => ({
      name: c.name,
      city: c.city,
      totalSpend: c.totalSpend
    }));

    // Return the structured approval details
    return {
      success: true,
      status: 'pending_approval',
      campaignId: campaign._id,
      campaignName: campaign.name,
      segmentId,
      segmentName: segment.name,
      channel,
      messageTemplate,
      audienceSize: totalCount,
      estimatedDeliveryRate: 98,
      expectedOpenRate: 68,
      previewRecipients
    };
  } catch (error) {
    console.error('[Tool - launch_campaign] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
