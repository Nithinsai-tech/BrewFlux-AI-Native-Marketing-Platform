import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import { buildMongoQuery } from './query_customers.js';

export function personalizeMessage(template, customer) {
  let message = template;
  message = message.replace(/{customer_name}/g, customer.name || '');
  message = message.replace(/{total_orders}/g, String(customer.totalOrders || 0));
  message = message.replace(/{total_spend}/g, String(customer.totalSpend || 0));
  message = message.replace(/{city}/g, customer.city || '');
  return message;
}

export async function preview_campaign({ segmentId, channel, messageTemplate }) {
  try {
    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return { success: false, error: 'Segment not found' };
    }

    const mongoQuery = buildMongoQuery(segment.rules);
    const customers = await Customer.find(mongoQuery).limit(3).lean();

    const previews = customers.map(cust => ({
      customerName: cust.name,
      recipient: channel === 'email' ? cust.email : cust.phone,
      personalizedMessage: personalizeMessage(messageTemplate, cust),
    }));

    return {
      success: true,
      segmentName: segment.name,
      channel,
      totalAudienceSize: segment.customerCount,
      previews,
    };
  } catch (error) {
    console.error('[Tool - preview_campaign] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
