import Customer from '../models/Customer.js';

export function buildMongoQuery(rules) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return {};
  }

  const conditionQueries = rules.conditions.map(cond => {
    const { field, operator, value } = cond;
    const condQuery = {};

    // Special handling for lastOrderDate (days ago)
    if (field === 'lastOrderDate') {
      const days = parseFloat(value);
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      if (operator === 'lt' || operator === 'days_ago') {
        // Less than X days ago (i.e. more recent order date)
        condQuery[field] = { $gte: dateLimit };
      } else if (operator === 'gt') {
        // More than X days ago (i.e. older order date)
        condQuery[field] = { $lte: dateLimit };
      } else if (operator === 'gte') {
        condQuery[field] = { $lte: dateLimit }; // More days ago = older date
      } else if (operator === 'lte') {
        condQuery[field] = { $gte: dateLimit }; // Less days ago = newer date
      } else if (operator === 'eq') {
        const startOfDay = new Date(dateLimit.setHours(0,0,0,0));
        const endOfDay = new Date(dateLimit.setHours(23,59,59,999));
        condQuery[field] = { $gte: startOfDay, $lte: endOfDay };
      }
      return condQuery;
    }

    // Standard field operators mapping
    switch (operator) {
      case 'gt':
        condQuery[field] = { $gt: value };
        break;
      case 'lt':
        condQuery[field] = { $lt: value };
        break;
      case 'gte':
        condQuery[field] = { $gte: value };
        break;
      case 'lte':
        condQuery[field] = { $lte: value };
        break;
      case 'eq':
        condQuery[field] = value;
        break;
      case 'in':
        condQuery[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
      case 'not_in':
        condQuery[field] = { $nin: Array.isArray(value) ? value : [value] };
        break;
      default:
        condQuery[field] = value;
    }

    return condQuery;
  });

  if (rules.operator === 'OR') {
    return { $or: conditionQueries };
  } else {
    return { $and: conditionQueries };
  }
}

export async function query_customers({ rules }) {
  try {
    const mongoQuery = buildMongoQuery(rules);
    console.log('[Tool - query_customers] Executing MongoDB Query:', JSON.stringify(mongoQuery));
    
    const count = await Customer.countDocuments(mongoQuery);
    
    const statsAggregation = await Customer.aggregate([
      { $match: mongoQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalSpend' },
          totalOrders: { $sum: '$totalOrders' }
        }
      }
    ]);

    const totalRevenue = statsAggregation[0]?.totalRevenue || 0;
    const totalOrders = statsAggregation[0]?.totalOrders || 0;

    const sample = await Customer.find(mongoQuery)
      .limit(5)
      .select('name email phone city totalOrders totalSpend lastOrderDate tags')
      .lean();

    return {
      success: true,
      count,
      totalRevenue,
      totalOrders,
      sample,
    };
  } catch (error) {
    console.error('[Tool - query_customers] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
