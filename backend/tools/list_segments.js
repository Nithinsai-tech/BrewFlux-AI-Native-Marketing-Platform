import Segment from '../models/Segment.js';

export async function list_segments() {
  try {
    const segments = await Segment.find({}).sort({ createdAt: -1 }).lean();
    
    return {
      success: true,
      count: segments.length,
      segments: segments.map(seg => ({
        segmentId: seg._id,
        name: seg.name,
        description: seg.description,
        customerCount: seg.customerCount,
        createdAt: seg.createdAt,
        rules: seg.rules,
      })),
    };
  } catch (error) {
    console.error('[Tool - list_segments] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
