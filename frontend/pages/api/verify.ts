/**
 * Next.js API proxy — POST /api/verify
 * Forwards the claim to the Express backend and returns the result.
 * This avoids CORS issues since the request is server-to-server.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { claim_text } = req.body;

  if (!claim_text || typeof claim_text !== "string" || !claim_text.trim()) {
    return res.status(400).json({ error: "Missing claim_text" });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: claim_text }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Backend error:", response.status, errorBody);
      return res.status(response.status).json({
        error: `Backend returned ${response.status}`,
        detail: errorBody,
      });
    }

    const data = await response.json();

    // Backend wraps result in { success: true, result: {...} }
    if (data.success && data.result) {
      return res.status(200).json(data.result);
    }

    return res.status(500).json({ error: "Unexpected backend response shape", data });
  } catch (err) {
    console.error("Proxy fetch failed:", err);
    return res.status(502).json({
      error: "Could not reach backend. Make sure the backend server is running on port 3001.",
    });
  }
}
