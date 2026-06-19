import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { url } = req.query;
  if (!url || typeof url !== "string") return res.status(400).json({ error: "Missing url" });

  try {
    const endpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&dnt=true&theme=dark`;
    const response = await fetch(endpoint);
    if (!response.ok) return res.status(response.status).json({ error: "Tweet not found or not embeddable" });
    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=300");
    res.json(data);
  } catch {
    res.status(502).json({ error: "Failed to fetch tweet embed" });
  }
}
