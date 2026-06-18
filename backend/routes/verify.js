/**
 * POST /api/verify
 * Orchestration endpoint — takes raw claim text, runs LLM extraction,
 * queries data sources, applies verdict logic and guardrail overrides.
 */

import express from 'express';
import axios from 'axios';
import { findLocationByText } from '../config/dfwCoordinates.js';
import { computeVerdict } from '../verdictLogic.js';

const router = express.Router();

const LLM_API_URL = process.env.LLM_API_URL || 'https://api.groq.com/openai/v1';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL   = process.env.LLM_MODEL   || 'llama3-8b-8192';

const EXTRACTION_SYSTEM_PROMPT = `
You are an emergency claim extraction engine for the DFW (Dallas-Fort Worth) Metroplex.

Your job is to analyze a raw community text string — a social media post, group chat message,
or verbal report — and extract structured information about an emergency or infrastructure claim.

## Instructions

1. Read the input text carefully.
2. Identify the most specific DFW location mentioned (neighborhood, landmark, city, intersection).
   If no location is mentioned, use "DFW Metroplex, TX".
3. Classify the primary claim type using ONLY one of these exact values:
   - tornado_touchdown
   - siren_malfunction
   - flooding
   - power_outage
   - other
4. Set verdict to "unverified" and confidence to "low" — the downstream pipeline will update these.
5. Write a brief, neutral explanation (1-2 sentences) of what the claim states.
6. Populate sources as an empty array [].
7. Write a safety_disclaimer reminding the user this is AI-assisted analysis, not an official alert.

## Output Format

Respond with ONLY a valid JSON object. No text outside the JSON block. Exact shape:

{
  "claim_text": "<the original input text, verbatim>",
  "extracted_location": "<most specific DFW location identified>",
  "claim_type": "<one of the five valid values>",
  "verdict": "unverified",
  "confidence": "low",
  "explanation": "<neutral 1-2 sentence summary of the claim>",
  "sources": [],
  "safety_disclaimer": "⚠️ This is an AI-assisted analysis, not an official emergency broadcast. Always follow guidance from local emergency management and the National Weather Service."
}

Rules: never change key names, never add extra fields, output must be valid JSON only.
`;

/**
 * POST /api/verify
 * Body: { "claim": "raw user text" }
 */
router.post('/', async (req, res) => {
  const { claim } = req.body;

  if (!claim || typeof claim !== 'string' || claim.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing or empty claim text',
    });
  }

  // ── Step 1: LLM extraction ───────────────────────────────────────────────
  let extracted;
  try {
    const llmResponse = await axios.post(
      `${LLM_API_URL}/chat/completions`,
      {
        model: LLM_MODEL,
        temperature: 0,
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user',   content: claim.trim() },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${LLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const raw = llmResponse.data.choices[0].message.content;
    extracted = JSON.parse(raw);
  } catch (err) {
    console.error('LLM extraction failed:', err.message);
    return res.status(502).json({
      success: false,
      error: 'LLM extraction failed',
      message: err.message,
    });
  }

  // ── Step 2: Resolve location to a known DFW entry ───────────────────────
  const location = findLocationByText(extracted.extracted_location);

  // ── Step 3: Fetch live data from Person 2's routes ──────────────────────
  const BASE = `http://localhost:${process.env.PORT || 3000}`;
  let nwsAlerts   = [];
  let pdIncidents = [];
  let ercotStatus = null;
  let usgsFlood   = null;

  try {
    if (location) {
      const [nwsRes, pdRes, ercotRes, usgsRes] = await Promise.allSettled([
        axios.get(`${BASE}/api/nws/alerts/location/${encodeURIComponent(location.name)}`, { timeout: 10000 }),
        axios.get(`${BASE}/api/mock/pd/location/${encodeURIComponent(location.name)}`, { timeout: 5000 }),
        axios.get(`${BASE}/api/mock/ercot/location/${encodeURIComponent(location.name)}`, { timeout: 5000 }),
        axios.get(`${BASE}/api/usgs/flood/location/${encodeURIComponent(location.id)}`, { timeout: 12000 }),
      ]);

      if (nwsRes.status   === 'fulfilled') nwsAlerts   = nwsRes.value.data.alerts    || [];
      if (pdRes.status    === 'fulfilled') pdIncidents = pdRes.value.data.incidents   || [];
      if (ercotRes.status === 'fulfilled') ercotStatus = ercotRes.value.data;
      if (usgsRes.status  === 'fulfilled') usgsFlood   = usgsRes.value.data;
    } else {
      // Fallback: fetch all active TX alerts
      const nwsRes = await axios.get(`${BASE}/api/nws/alerts/active`, { timeout: 10000 });
      nwsAlerts = nwsRes.data.alerts || [];
    }
  } catch (err) {
    console.warn('Data fetch warning (non-fatal):', err.message);
  }

  // ── Step 4: Verdict logic + guardrail overrides ──────────────────────────
  const { verdict, confidence, explanation, sources } = computeVerdict({
    extracted,
    location,
    nwsAlerts,
    pdIncidents,
    ercotStatus,
    usgsFlood,
  });

  // ── Step 5: Assemble final response ─────────────────────────────────────
  const result = {
    claim_text:         extracted.claim_text,
    extracted_location: extracted.extracted_location,
    claim_type:         extracted.claim_type,
    verdict,
    confidence,
    explanation,
    sources,
    safety_disclaimer:  extracted.safety_disclaimer,
  };

  res.json({ success: true, result });
});

export default router;
