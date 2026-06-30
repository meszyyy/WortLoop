// Vercel serverless function: GET /api/cards?page=N
// Proxies the Tatoeba API (which blocks browser CORS) and returns compact cards.

import { fetchCards } from './_tatoeba.mjs';

export default async function handler(req, res) {
  const raw = req.query?.page ?? new URL(req.url, 'http://localhost').searchParams.get('page');
  const page = Math.max(1, Number.parseInt(raw, 10) || 1);

  try {
    const cards = await fetchCards(page);
    // Cache at the edge so we stay a good citizen toward Tatoeba.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json(cards);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch cards from Tatoeba.' });
  }
}
