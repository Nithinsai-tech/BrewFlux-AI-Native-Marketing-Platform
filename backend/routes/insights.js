import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Campaign from '../models/Campaign.js';

const router = express.Router();

// Simple in-memory cache map
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const clearInsightsCache = () => {
  cache.delete('insights_data');
  console.log('[Cache Invalidation] Insights cache cleared.');
};

router.get('/', async (req, res) => {
  try {
    // Check in-memory cache first
    const cachedData = cache.get('insights_data');
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      console.log('[Cache Hit] Serving insights from memory cache.');
      return res.json(cachedData.data);
    }

    // 1. Fetch standard dashboard aggregates
    const totalCustomers = await Customer.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    
    const financialStats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalSpend' },
          avgSpend: { $avg: '$totalSpend' },
          totalOrdersCount: { $sum: '$totalOrders' },
        }
      }
    ]);

    const stats = financialStats[0] || { totalRevenue: 0, avgSpend: 0, totalOrdersCount: 0 };

    const cityDistribution = await Customer.aggregate([
      { $group: { _id: '$city', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]);

    const channelDistribution = await Order.aggregate([
      { $group: { _id: '$channel', count: { $sum: 1 }, totalRevenue: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]);

    const recentOrders = await Order.find()
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // 2. RUN PATTERN AGGREGATION QUERIES FOR SMART AI INSIGHTS
    const cutoff45 = new Date();
    cutoff45.setDate(cutoff45.getDate() - 45);

    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);

    const patterns = [
      {
        id: 'lapsed_vips',
        name: 'Lapsed VIPs',
        query: {
          totalSpend: { $gt: 5000 },
          lastOrderDate: { $lt: cutoff45 },
          totalOrders: { $gt: 3 }
        },
        details: 'Customers with totalSpend > 5000 AND lastOrderDate < 45 days ago AND totalOrders > 3',
        fallback: {
          segmentName: "Lapsed VIP Coffee Lovers",
          description: "High-value loyalists who spent over ₹5,000 but haven't placed an order in the last 45 days.",
          recommendedChannel: "whatsapp",
          suggestedMessage: "Hey {customer_name}, we miss you at BrewLux! ☕ Here is a special 20% discount on your next French Press or Cold Brew: VIPBACK20. Valid this weekend only!",
          reasoning: "VIP shoppers are highly valuable; re-engage them before they completely churn. WhatsApp has high read rates.",
          estimatedOpenRate: "~82%",
          urgency: "high"
        }
      },
      {
        id: 'loyalty_candidates',
        name: 'Loyalty Candidates',
        query: {
          totalOrders: { $gte: 5 },
          lastOrderDate: { $gte: cutoff30 }
        },
        details: 'Customers with totalOrders >= 5 AND lastOrderDate >= 30 days ago (recently active)',
        fallback: {
          segmentName: "BrewLux Gold Club Candidates",
          description: "Highly active customers who ordered 5+ times recently and are prime candidates for our VIP tier.",
          recommendedChannel: "email",
          suggestedMessage: "Hi {customer_name}, you're officially one of our top customers! 🌟 We'd love to invite you to the BrewLux Gold Loyalty Program for free daily refills and exclusive events.",
          reasoning: "Recently active frequent buyers have high brand affinity. An email invite elevates their status and secures lifetime value.",
          estimatedOpenRate: "~48%",
          urgency: "medium"
        }
      },
      {
        id: 'new_customer_window',
        name: 'New Customer Window',
        query: {
          createdAt: { $lt: cutoff30 },
          totalOrders: 1
        },
        details: 'Customers created > 30 days ago AND totalOrders === 1 (bought once, haven\'t returned)',
        fallback: {
          segmentName: "First-Order Win Back",
          description: "One-time purchasers who joined more than 30 days ago but haven't returned for a second purchase.",
          recommendedChannel: "sms",
          suggestedMessage: "Hi {customer_name}! Hope you enjoyed your first coffee at BrewLux. Use code MYSECONDDRINK for a free donut with your next order! Order at brewlux.co/order",
          reasoning: "The window to turn a first-time buyer into a repeat customer is closing. SMS yields immediate action.",
          estimatedOpenRate: "~72%",
          urgency: "medium"
        }
      },
      {
        id: 'high_freq_low_spend',
        name: 'High Frequency Low Spend',
        query: {
          totalOrders: { $gt: 8 },
          totalSpend: { $lt: 3000 }
        },
        details: 'Customers with totalOrders > 8 AND totalSpend < 3000 (frequent but low average order value)',
        fallback: {
          segmentName: "Premium Upsell Opportunity",
          description: "Frequent shoppers who purchase regularly but have a lower average spend. Ideal for premium bean updates.",
          recommendedChannel: "rcs",
          suggestedMessage: "Hey {customer_name}! Treat yourself on your next BrewLux visit. ☕ Upgrade to our premium single-origin French Press bundle today and get a free croissant!",
          reasoning: "Frequent customers trust our brand. Upselling premium items increases overall average transaction values.",
          estimatedOpenRate: "~78%",
          urgency: "low"
        }
      }
    ];

    const finalInsights = [];
    const apiKey = process.env.GEMINI_API_KEY;

    for (const pattern of patterns) {
      const customerCount = await Customer.countDocuments(pattern.query);
      if (customerCount > 0) {
        let insight = null;

        if (apiKey) {
          try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
              model: 'gemini-3.1-flash-lite',
              generationConfig: { responseMimeType: 'application/json' }
            });

            const prompt = `You are a professional CRM copywriter for BrewLux (a premium coffee chain).
            We have detected a pattern in our customer database:
            Pattern: "${pattern.name}"
            Criteria: ${pattern.details}
            Matched Customer Count: ${customerCount}

            Generate a strategic campaign recommendation targeting this group in JSON format matching this schema:
            {
              "segmentName": "string (creative marketing segment name)",
              "description": "string (clear user-friendly segment explanation)",
              "recommendedChannel": "whatsapp" | "sms" | "email" | "rcs",
              "suggestedMessage": "string (highly engaging message template utilizing variables like {customer_name}, {total_orders}, or {total_spend})",
              "reasoning": "string (why this specific group and channel was recommended)",
              "estimatedOpenRate": "string (e.g. ~75%)",
              "urgency": "high" | "medium" | "low"
            }`;

            const response = await model.generateContent(prompt);
            const text = response.response.text().trim();
            const parsed = JSON.parse(text);
            insight = { ...parsed, customerCount };
          } catch (err) {
            console.error(`Gemini generation failed for pattern ${pattern.name}, running fallback:`, err.message);
          }
        }

        // Fallback if Gemini is disabled or failed
        if (!insight) {
          insight = { ...pattern.fallback, customerCount };
        }

        finalInsights.push(insight);
      }
    }

    const payload = {
      summary: {
        totalCustomers,
        totalCampaigns,
        totalRevenue: stats.totalRevenue,
        avgSpend: Math.round(stats.avgSpend),
        totalOrders: stats.totalOrdersCount,
      },
      cityDistribution: cityDistribution.map(item => ({ name: item._id, value: item.value })),
      channelDistribution: channelDistribution.map(item => ({ channel: item._id, count: item.count, revenue: item.totalRevenue })),
      recentOrders: recentOrders.map(o => ({
        id: o._id,
        customerName: o.customerId ? o.customerId.name : 'Unknown',
        amount: o.amount,
        channel: o.channel,
        date: o.createdAt,
      })),
      insights: finalInsights,
      recommendations: finalInsights, // duplicated for compatibility
    };

    // Store in-memory cache
    cache.set('insights_data', {
      data: payload,
      timestamp: Date.now()
    });

    res.json(payload);
  } catch (error) {
    console.error('[GET /api/insights Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
