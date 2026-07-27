/**
 * server/index.js
 * Tiny Express dev server that mirrors the Vercel serverless function locally.
 * This lets you run `npm start` to test the full stack (frontend + AI proxy)
 * without deploying to Vercel.
 *
 * In production (Vercel), this file is NOT used — api/generate.js handles requests
 * directly as a serverless function.
 *
 * Usage: started automatically via `npm start` (uses concurrently to run
 * this alongside the Vite dev server). Can also be run standalone:
 *   node server/index.js
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import handler from '../api/generate.js';

// Load .env file (GEMINI_API_KEY etc.)
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Parse JSON bodies
app.use(express.json());

// Allow the Vite dev server (port 5173) to call this server
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));

// Mount the generate handler at /api/generate
// We adapt the Vercel-style handler signature to Express's req/res
app.post('/api/generate', async (req, res) => {
  // The Vercel handler expects req.body to already be parsed — Express does that above
  await handler(req, res);
});

app.listen(PORT, () => {
  console.log(`\n🚀 Dev API server running at http://localhost:${PORT}`);
  console.log(`   POST /api/generate → Gemini AI proxy`);
  console.log(`   API key loaded: ${process.env.GEMINI_API_KEY ? '✅ Yes' : '❌ No (set GEMINI_API_KEY in .env)'}\n`);
});
