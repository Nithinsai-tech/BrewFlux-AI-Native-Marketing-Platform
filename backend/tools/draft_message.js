import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

export async function draft_message({ segmentName, channel, goal, sampleCustomers }) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API key is missing. Please configure GEMINI_API_KEY in the environment.',
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    const prompt = `You are a professional copywriting agent for BrewLux, a premium coffee brand.
Write a customized message template for the following details:
- Channel: ${channel} (WhatsApp, Email, SMS, RCS)
- Campaign Goal: ${goal}
- Target Segment: ${segmentName}
- Sample Target Customers: ${JSON.stringify(sampleCustomers)}

Constraints:
1. Provide ONLY the finalized template text. Do not include any greeting, preamble, metadata, quotes, or conversational fillers.
2. Use placeholder variables in curly braces to personalize details. Supported placeholders are:
   - {customer_name}
   - {total_orders}
   - {total_spend}
   - {city}
3. Adjust length, tone, and format strictly according to the channel:
   - WhatsApp: Warm, highly conversational, friendly, use emojis.
   - Email: Include a "Subject:" line on the first line, then the email body. Tone should be slightly formal and inviting.
   - SMS: Very short, clear call to action, max 160 characters.
   - RCS: Rich, highly engaging, concise.

Draft Template:`;

    const response = await model.generateContent(prompt);
    const template = response.response.text().trim();

    return {
      success: true,
      channel,
      template,
    };
  } catch (error) {
    console.error('[Tool - draft_message] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
