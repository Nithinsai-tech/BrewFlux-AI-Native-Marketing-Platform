import Campaign from '../models/Campaign.js';

/**
 * Lists all campaigns in the system with their status, channel, and audience details.
 * Useful for resolving a campaign name or finding which campaign to query.
 */
export async function list_campaigns() {
  try {
    const campaigns = await Campaign.find({}, '_id name status channel stats createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      campaigns: campaigns.map(c => ({
        campaignId: c._id.toString(),
        name: c.name,
        status: c.status,
        channel: c.channel,
        totalAudience: c.stats?.total || 0,
        createdAt: c.createdAt
      }))
    };
  } catch (error) {
    console.error('[Tool - list_campaigns] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
