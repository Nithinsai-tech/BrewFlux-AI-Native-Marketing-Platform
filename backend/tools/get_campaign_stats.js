import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import Communication from '../models/Communication.js';

export async function get_campaign_stats({ campaignId }) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    const campaignObjectId = new mongoose.Types.ObjectId(campaignId);

    // Aggregate status counts
    const statusCounts = await Communication.aggregate([
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

    statusCounts.forEach((item) => {
      counts[item._id] = item.count;
    });

    // Since status updates sequentially (e.g. 'converted' is also 'clicked', 'opened', 'delivered', 'sent'),
    // we aggregate them cumulatively to calculate real conversion rates.
    const totalSent = counts.sent + counts.delivered + counts.read + counts.opened + counts.clicked + counts.converted;
    const totalDelivered = counts.delivered + counts.read + counts.opened + counts.clicked + counts.converted;
    const totalOpened = counts.opened + counts.clicked + counts.converted;
    const totalClicked = counts.clicked + counts.converted;
    const totalConverted = counts.converted;
    const totalFailed = counts.failed;

    // Calculate rates
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 1000) / 10 : 0;
    const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 1000) / 10 : 0;
    const clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 1000) / 10 : 0;
    const convertRate = totalClicked > 0 ? Math.round((totalConverted / totalClicked) * 1000) / 10 : 0;

    const stats = {
      total: campaign.stats.total,
      sent: totalSent,
      delivered: totalDelivered,
      failed: totalFailed,
      opened: totalOpened,
      read: counts.read + counts.opened + counts.clicked + counts.converted, // count all that read
      clicked: totalClicked,
      converted: totalConverted,
    };

    // Update campaign stats cache in MongoDB
    campaign.stats = stats;
    await campaign.save();

    return {
      success: true,
      campaignId: campaign._id,
      campaignName: campaign.name,
      status: campaign.status,
      stats,
      rates: {
        deliveryRate,
        openRate,
        clickRate,
        convertRate,
      },
    };
  } catch (error) {
    console.error('[Tool - get_campaign_stats] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
