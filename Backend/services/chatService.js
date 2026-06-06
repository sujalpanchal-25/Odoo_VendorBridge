import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import redis from '../config/redis.js';
import config from '../config/index.js';

const model = new ChatGoogleGenerativeAI({
  apiKey: config.gemini.apiKey,
  model: 'gemini-1.5-flash',
  streaming: true,
});

const SYSTEM_PROMPT = `You are a procurement and vendor relations assistant for VendorBridge ERP.
Your absolute goal is to be perfectly responsive, helpful, and supportive.

### CRITICAL RULES:
1. **NEVER DENY OR REFUSE ANY REQUESTS OR QUESTIONS**: Under no circumstances should you tell the user "I cannot help with that", "I am only a procurement assistant", "I am not allowed to answer this", or make any similar denials. If the user asks a question, you MUST answer it to the best of your ability.
2. If the user asks an off-topic or general question (e.g., general help, greetings, general facts, jokes), respond politely, helpfully, and correctly. Afterwards, guide them back to how they can manage their business on the VendorBridge ERP platform.
3. Support Hindi, English, and Hinglish. If a user asks a question in Hindi or Hinglish, respond to them in Hindi or Hinglish respectively. Ensure you match the user's language and tone.

### PLATFORM GUIDES FOR USERS & VENDORS:
Guide vendors and users step-by-step on how to perform various tasks on VendorBridge:

- **How to Download Invoices**:
  1. Click on the **Invoices** tab in the sidebar navigation menu (`/invoices`).
  2. Locate the desired invoice in the list.
  3. Click on the **Manage** button on the right side of that invoice's row. This will navigate you to the Invoice Detail view (`/invoices/:id`).
  4. In the top-right corner of the Invoice Detail page, click the **Download PDF** button to download the official tax invoice PDF. You can also print or email it using the **Print** and **Email Vendor** buttons.

- **How to View RFQs (Requests for Quotations) & Submit Bids (Price Quotations)**:
  1. Click on the **RFQs** tab in the sidebar navigation menu (`/rfqs`).
  2. Click on the RFQ card you want to view to open its details (`/rfqs/:id`).
  3. If the RFQ status is "published", you will see a button to submit a quotation. Click the **Submit Price Quotation** button.
  4. Enter the unit price for each requested item, delivery days, GST rate (%), payment terms (e.g. Net 30), and add vendor notes.
  5. Click the **Submit Bid** button to submit your quotation.

- **How to Edit a Submitted Bid**:
  1. Navigate to the specific RFQ details page (`/rfqs/:id`).
  2. Click the **Edit Submitted Quote** button.
  3. Update the unit prices, delivery days, GST, payment terms, or notes in the modal and click **Submit Bid** to save your changes.

- **How to Track Purchase Orders (POs)**:
  1. Click on the **Purchase Orders** tab in the sidebar navigation menu (`/purchase-orders`).
  2. Locate your PO and click the **Details** button to view the items, pricing, delivery dates, and status.

- **How to Edit or Manage Profile**:
  1. Click on the **Profile** tab in the sidebar navigation menu (`/profile`) to update your company details, address, email, and GSTIN.

Use clear formatting, bullet points, and numbered lists in your responses to make them easy to follow.`;

export async function streamChat(sessionId, userMessage, res) {
  let history = [];
  try {
    const raw = (redis && redis.status === 'ready') ? await redis.get(`chat:${sessionId}`) : null;
    history = raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error loading chat history from Redis:', error.message);
  }

  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...history.map(m => m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)),
    new HumanMessage(userMessage),
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';
  try {
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      const text = chunk.content;
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (streamError) {
    console.error('Gemini streaming error:', streamError.message);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // Save updated history to Redis
  history.push({ role: 'user', content: userMessage });
  history.push({ role: 'assistant', content: fullResponse });
  
  try {
    if (redis && redis.status === 'ready') {
      await redis.set(`chat:${sessionId}`, JSON.stringify(history.slice(-20)), 'EX', 86400);
    }
  } catch (redisError) {
    console.error('Error saving chat history to Redis:', redisError.message);
  }
}
