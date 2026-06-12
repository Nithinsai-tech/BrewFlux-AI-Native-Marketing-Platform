import Segment from '../models/Segment.js';
import Customer from '../models/Customer.js';
import { buildMongoQuery } from './query_customers.js';

export async function create_segment({ name, description, rules }) {
  try {
    const mongoQuery = buildMongoQuery(rules);
    const matchedCount = await Customer.countDocuments(mongoQuery);

    const segment = new Segment({
      name,
      description: description || '',
      rules,
      customerCount: matchedCount,
    });

    await segment.save();

    return {
      success: true,
      segmentId: segment._id,
      name: segment.name,
      description: segment.description,
      customerCount: segment.customerCount,
      createdAt: segment.createdAt,
    };
  } catch (error) {
    console.error('[Tool - create_segment] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
