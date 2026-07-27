// quick-test-api.js — run with: node quick-test-api.js
// Tests the Gemini API key directly without the full server

import { config } from 'dotenv';
config();

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
console.log(`Testing key: ${apiKey.substring(0, 12)}... (length: ${apiKey.length})`);

try {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: 'You are a helpful assistant.',
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 64,
    },
  });

  console.log('Sending test request to Gemini...');
  const result = await model.generateContent('Return this exact JSON: {"status":"ok"}');
  const text = result.response.text();
  console.log('✅ API KEY WORKS! Response:', text);
} catch (err) {
  console.error('❌ API call failed:', err.message);
  if (err.message?.includes('API_KEY') || err.message?.includes('401') || err.message?.includes('403')) {
    console.error('   → The key appears to be invalid or not a Gemini API key.');
    console.error('   → Get a free key at: https://aistudio.google.com/app/apikey');
  }
  process.exit(1);
}
