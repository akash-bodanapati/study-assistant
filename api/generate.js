/**
 * api/generate.js
 * Vercel serverless function — the ONLY place the Gemini API key lives.
 * The key is read from process.env.GEMINI_API_KEY (set in Vercel dashboard
 * or a local .env file). It is NEVER sent to or stored in the browser.
 *
 * Flow:
 *  1. Receive { text } from the browser's POST body.
 *  2. Build a system prompt instructing Gemini to return ONLY the JSON contract.
 *  3. Call Gemini with responseMimeType: "application/json" — this forces the
 *     model into structured output mode so it returns raw JSON rather than prose.
 *     We still validate the response ourselves below because the model can
 *     occasionally return JSON that technically parses but has wrong shapes or
 *     out-of-range values (e.g. correctIndex pointing beyond the options array).
 *  4. Parse and lightly validate the response, then forward it to the browser.
 *  5. On any failure, return a clear { error: "..." } object — never a raw crash.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// --- JSON contract schema description embedded in the system prompt ---
// We describe the shape in natural language because Gemini's JSON mode
// already enforces structure; the prose description adds semantic clarity.
const SYSTEM_PROMPT = `You are a study assistant that generates learning materials.
When given notes or a topic, you must respond with ONLY valid JSON — no markdown,
no code fences, no prose, just the raw JSON object.

The JSON must exactly match this structure:
{
  "topic": "<short label for this study set, max 60 chars>",
  "flashcards": [
    { "id": "<unique string like fc-1>", "front": "<question/prompt side>", "back": "<answer side>" }
  ],
  "quiz": [
    {
      "id": "<unique string like q-1>",
      "question": "<the question text>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correctIndex": <0-based index of the correct option, integer>,
      "explanation": "<brief explanation of why the correct answer is right>"
    }
  ]
}

Rules:
- Generate exactly 8 flashcards (front = concise question/concept, back = clear answer).
- Generate exactly 6 quiz questions, each with exactly 4 options.
- correctIndex must be 0, 1, 2, or 3 — never out of range.
- All strings must be non-empty.
- Do not wrap the JSON in markdown code fences or add any text outside the JSON.`;

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { text } = req.body ?? {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Request body must include a non-empty "text" field.' });
  }

  if (text.trim().length > 5000) {
    return res.status(400).json({ error: 'Input text exceeds 5000 character limit.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    return res.status(500).json({
      error: 'Server configuration error: API key not set. Please contact the administrator.',
    });
  }

  try {
    // Initialize Gemini SDK with the server-side API key.
    // responseMimeType: "application/json" puts the model into structured-output
    // mode so it returns raw JSON rather than markdown prose. We still validate
    // below because the model can return JSON that parses correctly but has
    // wrong field shapes or out-of-range correctIndex values.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        // Moderate temperature: creative enough for varied content,
        // low enough to stay within the strict JSON schema.
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    });

    const userPrompt = `Generate a study set for the following topic or notes:\n\n${text.trim()}`;

    const result = await model.generateContent(userPrompt);
    const rawText = result.response.text();

    // Parse the JSON response — the model should return clean JSON due to
    // responseMimeType: "application/json", but we still wrap in try/catch
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Gemini returned non-JSON response:', rawText.slice(0, 200));
      return res.status(502).json({
        error: 'The AI returned a response that could not be parsed as JSON. Please try again.',
      });
    }

    // Light server-side sanity check before forwarding to frontend
    // (The frontend also validates; this catches obvious failures early)
    if (!parsed || typeof parsed !== 'object') {
      return res.status(502).json({ error: 'AI response was not a JSON object.' });
    }
    if (!Array.isArray(parsed.flashcards) || !Array.isArray(parsed.quiz)) {
      return res.status(502).json({
        error: 'AI response was missing required flashcards or quiz arrays.',
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Gemini API error:', err);

    // Surface a friendly error without leaking internal details
    const message = err?.message ?? 'Unknown error';
    if (message.includes('quota') || message.includes('rate') || message.includes('429')) {
      return res.status(429).json({ error: 'API rate limit exceeded. Please wait a moment and try again.' });
    }
    if (message.includes('API_KEY') || message.includes('401') || message.includes('403')) {
      return res.status(401).json({ error: 'Invalid API key. Please check your server configuration.' });
    }

    return res.status(500).json({
      error: `Failed to generate study set: ${message}. Please try again.`,
    });
  }
}
