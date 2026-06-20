import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3003";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { claim_text } = req.body ?? {};
  if (!claim_text) return res.status(400).json({ error: "Missing claim_text" });

  try {
    const response = await fetch(`${BACKEND_URL}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: claim_text }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    const result = data.success ? data.result : data;
    return res.json(result);
  } catch (err) {
    console.error("verify proxy error:", err);
    return res.status(502).json({ error: "Backend unreachable" });
  }
}
