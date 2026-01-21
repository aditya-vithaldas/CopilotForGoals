const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDKagGE2v59Sa0CBZslqE-u07xpkHHg3PQ';

let genAI = null;
let model = null;

function initializeGemini(apiKey) {
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    return true;
  }
  return false;
}

// Initialize with environment variable if available
if (GEMINI_API_KEY) {
  initializeGemini(GEMINI_API_KEY);
}

async function chatWithContext(message, context, chatHistory = []) {
  if (!model) {
    throw new Error('Gemini API key not configured. Please set your API key.');
  }

  // Build the system prompt with context
  const systemPrompt = `You are a helpful AI assistant that helps users work with their connected data sources. You have access to the following data and context from the user's workspace:

${context}

Based on this context, help the user with their questions. Be concise, helpful, and reference specific information from the data sources when relevant. If you're unsure about something or the information isn't in the context, say so.`;

  // Build conversation history for multi-turn chat
  const history = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I have access to your workspace data and will help you work with your connected sources. How can I assist you?' }]
        },
        ...history
      ]
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to get response from Gemini: ${error.message}`);
  }
}

async function summarizeContent(content, type = 'document') {
  if (!model) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = type === 'document'
    ? `Summarize the following document very briefly. Format your response as:

**Key Points:**
• [one short bullet point]
• [one short bullet point]

**Action Items:**
• [short action item]
• [short action item]
• [short action item]

Keep each bullet point under 10 words. Be extremely concise.

Document:
${content}`
    : `Analyze the following data and provide insights:\n\n${content}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini summarization error:', error);
    throw new Error(`Failed to summarize content: ${error.message}`);
  }
}

module.exports = {
  initializeGemini,
  chatWithContext,
  summarizeContent
};
