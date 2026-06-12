import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import Communication from '../models/Communication.js';

/**
 * Aggregates and analyzes actual delivery, read, click, and conversion rates
 * for a specific campaign, segmented by city and customer tags.
 */
export async function analyze_campaign_performance({ campaignId }) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    const campaignObjectId = new mongoose.Types.ObjectId(campaignId);

    // 1. Fetch overall status counts
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

    const totalSent = counts.sent + counts.delivered + counts.read + counts.opened + counts.clicked + counts.converted;
    const totalDelivered = counts.delivered + counts.read + counts.opened + counts.clicked + counts.converted;
    const totalOpened = counts.opened + counts.clicked + counts.converted;
    const totalClicked = counts.clicked + counts.converted;
    const totalConverted = counts.converted;
    const totalFailed = counts.failed;
    const audienceSize = campaign.stats?.total || totalSent || 1;

    // Calculate overall rates (in %)
    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
    const readRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;
    const clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;
    const conversionRate = totalClicked > 0 ? Math.round((totalConverted / totalClicked) * 100) : 0;

    // 2. City Aggregates
    const cityAgg = await Communication.aggregate([
      { $match: { campaignId: campaignObjectId } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $group: {
          _id: { city: '$customer.city', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    const cityStats = {};
    cityAgg.forEach((item) => {
      const city = item._id.city || 'Unknown';
      const status = item._id.status;
      const count = item.count;

      if (!cityStats[city]) {
        cityStats[city] = {
          sent: 0,
          delivered: 0,
          read: 0,
          clicked: 0,
          converted: 0
        };
      }

      if (['sent', 'delivered', 'opened', 'read', 'clicked', 'converted'].includes(status)) {
        cityStats[city].sent += count;
      }
      if (['delivered', 'opened', 'read', 'clicked', 'converted'].includes(status)) {
        cityStats[city].delivered += count;
      }
      if (['opened', 'read', 'clicked', 'converted'].includes(status)) {
        cityStats[city].read += count;
      }
      if (['clicked', 'converted'].includes(status)) {
        cityStats[city].clicked += count;
      }
      if (status === 'converted') {
        cityStats[city].converted += count;
      }
    });

    const cityPerformance = Object.keys(cityStats).map((city) => {
      const s = cityStats[city];
      const cityDelivRate = s.sent > 0 ? Math.round((s.delivered / s.sent) * 100) : 0;
      const cityReadRate = s.delivered > 0 ? Math.round((s.read / s.delivered) * 100) : 0;
      const cityClickRate = s.read > 0 ? Math.round((s.clicked / s.read) * 100) : 0;
      const cityConvRate = s.clicked > 0 ? Math.round((s.converted / s.clicked) * 100) : 0;

      return {
        city,
        sent: s.sent,
        delivered: s.delivered,
        read: s.read,
        clicked: s.clicked,
        converted: s.converted,
        deliveryRate: `${cityDelivRate}%`,
        readRate: `${cityReadRate}%`,
        clickRate: `${cityClickRate}%`,
        conversionRate: `${cityConvRate}%`
      };
    });

    // Determine highest engagement city (by read rate) and highest clicks city (by click rate)
    let mostEngagedCity = 'None';
    let maxReadRate = -1;
    let mostClickedCity = 'None';
    let maxClickRate = -1;

    cityPerformance.forEach((c) => {
      const readPct = parseInt(c.readRate);
      if (readPct > maxReadRate && c.delivered > 0) {
        maxReadRate = readPct;
        mostEngagedCity = c.city;
      }
      const clickPct = parseInt(c.clickRate);
      if (clickPct > maxClickRate && c.read > 0) {
        maxClickRate = clickPct;
        mostClickedCity = c.city;
      }
    });

    // 3. Tag Aggregates
    const tagAgg = await Communication.aggregate([
      { $match: { campaignId: campaignObjectId } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      { $unwind: '$customer.tags' },
      {
        $group: {
          _id: { tag: '$customer.tags', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    const tagStats = {};
    tagAgg.forEach((item) => {
      const tag = item._id.tag;
      const status = item._id.status;
      const count = item.count;

      if (!tagStats[tag]) {
        tagStats[tag] = {
          clicked: 0,
          converted: 0
        };
      }

      if (['clicked', 'converted'].includes(status)) {
        tagStats[tag].clicked += count;
      }
      if (status === 'converted') {
        tagStats[tag].converted += count;
      }
    });

    const tagPerformance = Object.keys(tagStats).map((tag) => {
      const s = tagStats[tag];
      const tagConvRate = s.clicked > 0 ? Math.round((s.converted / s.clicked) * 100) : 0;
      return {
        tag,
        clicked: s.clicked,
        converted: s.converted,
        conversionRate: `${tagConvRate}%`
      };
    });

    // Find VIP conversion rate specifically
    const vipTagObj = tagPerformance.find(t => t.tag.toLowerCase() === 'vip');
    const vipConversionRate = vipTagObj ? vipTagObj.conversionRate : `${conversionRate}%`;

    return {
      success: true,
      campaignId: campaign._id.toString(),
      campaignName: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      summary: {
        audienceSize,
        deliveryRate: `${deliveryRate}%`,
        readRate: `${readRate}%`,
        clickRate: `${clickRate}%`,
        conversionRate: `${conversionRate}%`
      },
      cityPerformance,
      tagPerformance,
      insights: {
        mostEngagedCity,
        mostClickedCity,
        vipConversionRate
      }
    };
  } catch (error) {
    console.error('[Tool - analyze_campaign_performance] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
