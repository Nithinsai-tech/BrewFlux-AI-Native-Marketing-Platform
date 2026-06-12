import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Import Mongoose tool handlers
import { query_customers } from '../tools/query_customers.js';
import { create_segment } from '../tools/create_segment.js';
import { draft_message } from '../tools/draft_message.js';
import { preview_campaign } from '../tools/preview_campaign.js';
import { launch_campaign } from '../tools/launch_campaign.js';
import { get_campaign_stats } from '../tools/get_campaign_stats.js';
import { list_segments } from '../tools/list_segments.js';
import { list_campaigns } from '../tools/list_campaigns.js';
import { analyze_campaign_performance } from '../tools/analyze_campaign_performance.js';

dotenv.config();

const router = express.Router();

// Define tool schemas for Claude function calling
const toolsList = [
  {
    name: 'query_customers',
    description: 'Queries the customer database using conditions (operator "AND"/"OR") to find counts and shopper details samples.',
    input_schema: {
      type: 'object',
      properties: {
        rules: {
          type: 'object',
          properties: {
            operator: { type: 'string', enum: ['AND', 'OR'] },
            conditions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', enum: ['totalSpend', 'totalOrders', 'lastOrderDate', 'city', 'tags'] },
                  operator: { type: 'string', enum: ['gt', 'lt', 'gte', 'lte', 'eq', 'in', 'not_in', 'days_ago'] },
                  value: { type: 'any' },
                },
                required: ['field', 'operator', 'value'],
              },
            },
          },
          required: ['operator', 'conditions'],
        },
      },
      required: ['rules'],
    },
  },
  {
    name: 'create_segment',
    description: 'Saves a segment selection (rules) to MongoDB and returns segment info with matched counts.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Descriptive segment name (e.g. Pune Croissant Fans)' },
        description: { type: 'string', description: 'Informative segment purpose description' },
        rules: {
          type: 'object',
          properties: {
            operator: { type: 'string', enum: ['AND', 'OR'] },
            conditions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', enum: ['totalSpend', 'totalOrders', 'lastOrderDate', 'city', 'tags'] },
                  operator: { type: 'string', enum: ['gt', 'lt', 'gte', 'lte', 'eq', 'in', 'not_in', 'days_ago'] },
                  value: { type: 'any' },
                },
                required: ['field', 'operator', 'value'],
              },
            },
          },
          required: ['operator', 'conditions'],
        },
      },
      required: ['name', 'rules'],
    },
  },
  {
    name: 'draft_message',
    description: 'Uses an internal copywriting assistant to generate a tailored message template with personal variables.',
    input_schema: {
      type: 'object',
      properties: {
        segmentName: { type: 'string', description: 'Name of the segment target audience' },
        channel: { type: 'string', enum: ['whatsapp', 'sms', 'email', 'rcs'] },
        goal: { type: 'string', description: 'Objective (e.g. promo, re-engage)' },
        sampleCustomers: {
          type: 'array',
          items: { type: 'object' },
          description: 'First few matching customer details from database to align tags',
        },
      },
      required: ['segmentName', 'channel', 'goal', 'sampleCustomers'],
    },
  },
  {
    name: 'preview_campaign',
    description: 'Applies a message template onto the segment members to preview the first 3 customized outcomes.',
    input_schema: {
      type: 'object',
      properties: {
        segmentId: { type: 'string', description: 'Segment database ObjectId' },
        channel: { type: 'string', enum: ['whatsapp', 'sms', 'email', 'rcs'] },
        messageTemplate: { type: 'string', description: 'Personalized template text containing variables like {customer_name}' },
      },
      required: ['segmentId', 'channel', 'messageTemplate'],
    },
  },
  {
    name: 'launch_campaign',
    description: 'Prepares a campaign for review and approval before final launch. Returns draft info and recipient previews.',
    input_schema: {
      type: 'object',
      properties: {
        segmentId: { type: 'string', description: 'Segment database ObjectId' },
        channel: { type: 'string', enum: ['whatsapp', 'sms', 'email', 'rcs'] },
        messageTemplate: { type: 'string', description: 'Finalized message template' },
        campaignName: { type: 'string', description: 'Descriptive title for the marketing campaign run' },
      },
      required: ['segmentId', 'channel', 'messageTemplate', 'campaignName'],
    },
  },
  {
    name: 'get_campaign_stats',
    description: 'Retrieves current live conversion counters and funnel rates for a campaign.',
    input_schema: {
      type: 'object',
      properties: {
        campaignId: { type: 'string', description: 'Campaign database ObjectId' },
      },
      required: ['campaignId'],
    },
  },
  {
    name: 'list_segments',
    description: 'Lists all available segments with their names, descriptions, and customer count parameters.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_campaigns',
    description: 'Lists all available campaigns with their IDs, names, status, channel, and audience details.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'analyze_campaign_performance',
    description: 'Analyzes campaign performance and returns audience size, delivery, read, click, and conversion rates segmented by city and customer tags using actual database statistics.',
    input_schema: {
      type: 'object',
      properties: {
        campaignId: { type: 'string', description: 'Campaign database ObjectId' },
      },
      required: ['campaignId'],
    },
  },
];

// Switch map tool executions
async function executeTool(name, params) {
  console.log(`[Agent Router] Executing tool "${name}" with params:`, JSON.stringify(params));
  switch (name) {
    case 'query_customers':
      return await query_customers(params);
    case 'create_segment':
      return await create_segment(params);
    case 'draft_message':
      return await draft_message(params);
    case 'preview_campaign':
      return await preview_campaign(params);
    case 'launch_campaign':
      return await launch_campaign(params);
    case 'get_campaign_stats':
      return await get_campaign_stats(params);
    case 'list_segments':
      return await list_segments(params);
    case 'list_campaigns':
      return await list_campaigns(params);
    case 'analyze_campaign_performance':
      return await analyze_campaign_performance(params);
    default:
      throw new Error(`Tool executor for "${name}" not found.`);
  }
}

// Core AI ChatAgent Streaming Endpoint (PROMPT 3 / PROMPT 5)
const getGeminiTools = () => {
  const convertSchemaType = (schema) => {
    if (!schema) return undefined;
    const mapped = { ...schema };
    if (typeof mapped.type === 'string') {
      mapped.type = mapped.type.toUpperCase();
      if (mapped.type === 'ANY') {
        delete mapped.type;
      }
    }
    if (mapped.properties) {
      const newProps = {};
      for (const k in mapped.properties) {
        newProps[k] = convertSchemaType(mapped.properties[k]);
      }
      mapped.properties = newProps;
    }
    if (mapped.items) {
      mapped.items = convertSchemaType(mapped.items);
    }
    return mapped;
  };

  const functionDeclarations = toolsList.map(t => ({
    name: t.name,
    description: t.description,
    parameters: convertSchemaType(t.input_schema)
  }));

  return [{ functionDeclarations }];
};

// Core AI ChatAgent Streaming Endpoint (PROMPT 3 / PROMPT 5)
router.post('/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (type, data = {}) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      sendEvent('error', { message: 'Invalid request: messages array is required.' });
      return res.end();
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      sendEvent('error', { message: 'Gemini API key is missing. Define GEMINI_API_KEY on the server.' });
      return res.end();
    }

    const systemPrompt = `You are Aria, an AI marketing assistant for BrewLux — a premium coffee chain. You help marketers reach customers intelligently. You have access to real customer data. Be concise, warm, and proactive. Always suggest smart next steps. When launching campaigns, confirm the audience, message, and channel BEFORE calling launch_campaign. Refer to amounts in ₹.

When a user asks to analyze a campaign's performance or asks "How is my campaign performing?" or "What insights do you have?":
1. First, call list_campaigns to find matching campaigns if campaignId is not explicitly provided.
2. Call analyze_campaign_performance with the correct campaignId.
3. Present a formatted response following this structure:

### Campaign Summary
- **Audience Size**: [Audience Size count]
- **Delivery Rate**: [Delivery Rate %]
- **Read Rate**: [Read Rate %]
- **Click Rate**: [Click Rate %]
- **Conversion Rate**: [Conversion Rate %]

### Insights
- ✓ [Insight 1, e.g., Delivery rate above average or status of delivery]
- ✓ [Insight 2, e.g., Which city's customers engaged/read most, e.g., Mumbai customers engaged most]
- ✓ [Insight 3, e.g., Which city's customers clicked most, e.g., Bangalore customers clicked most]
- ✓ [Insight 4, e.g., Tag conversion rate, e.g., VIP customers converted at 12%]

### Recommendations
- ✓ [Recommendation 1, e.g., Increase WhatsApp campaigns]
- ✓ [Recommendation 2, e.g., Run follow-up campaign to readers who did not click]
- ✓ [Recommendation 3, e.g., Create loyalty offer for converters]

Use actual campaign data from MongoDB. Do not generate fake numbers.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: systemPrompt,
      tools: getGeminiTools()
    });

    // Format chat history to Gemini's expected message structure, merging consecutive roles
    let chatHistory = [];
    messages.forEach((msg) => {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      let text = '';
      if (typeof msg.content === 'string') {
        text = msg.content;
      } else if (Array.isArray(msg.content)) {
        text = msg.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n');
      }

      if (!text) return;

      if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === role) {
        chatHistory[chatHistory.length - 1].parts[0].text += '\n' + text;
      } else {
        chatHistory.push({
          role,
          parts: [{ text }]
        });
      }
    });

    let runAgentLoop = true;
    let loopCount = 0;

    while (runAgentLoop && loopCount < 5) {
      loopCount++;
      console.log(`[Agent Run Loop] Iteration ${loopCount}`);

      const resultStream = await model.generateContentStream({ contents: chatHistory });

      let textBuffer = '';
      let functionCalls = null;
      let functionCallParts = [];

      for await (const chunk of resultStream.stream) {
        try {
          const textDelta = chunk.text();
          if (textDelta) {
            textBuffer += textDelta;
            sendEvent('text', { text: textDelta });
          }
        } catch (e) {
          // Ignore text extraction error on function call chunk
        }

        const calls = typeof chunk.functionCalls === 'function' ? chunk.functionCalls() : chunk.functionCalls;
        if (calls && calls.length > 0) {
          functionCalls = calls;
        }

        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.functionCall) {
            functionCallParts.push(part);
          }
        }
      }

      if (textBuffer) {
        chatHistory.push({
          role: 'model',
          parts: [{ text: textBuffer }]
        });
      }

      if (!functionCalls || functionCalls.length === 0) {
        runAgentLoop = false;
        break;
      }

      // Add model's tool call turn to the history (including thoughtSignature if present)
      chatHistory.push({
        role: 'model',
        parts: functionCallParts.length > 0 ? functionCallParts : functionCalls.map(call => ({
          functionCall: {
            name: call.name,
            args: call.args
          }
        }))
      });

      // Execute all function calls in parallel
      const functionResponses = [];
      for (const call of functionCalls) {
        sendEvent('tool_call', { tool: call.name, status: 'running', params: call.args });

        let result;
        try {
          result = await executeTool(call.name, call.args);
        } catch (err) {
          result = { success: false, error: err.message };
        }

        sendEvent('tool_result', { tool: call.name, result });

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { result }
          }
        });
      }

      // Add function execution outputs to chat history
      chatHistory.push({
        role: 'user',
        parts: functionResponses
      });
    }

    sendEvent('end');
    res.end();
  } catch (error) {
    console.error('[Agent Stream Error]:', error);
    sendEvent('error', { message: error.message });
    res.end();
  }
});

export default router;
