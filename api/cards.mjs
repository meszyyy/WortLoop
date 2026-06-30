// Vercel serverless function: GET /api/cards?count=N
// Proxies the Tatoeba API (which blocks browser CORS) and returns N random cards.

import { fetchRandomCards, MAX_COUNT } from './_tatoeba.mjs';

export default async function handler(req, res) {
  const raw = req.query?.count ?? new URL(req.url, 'http://localhost').searchParams.get('count');
  const count = Math.min(Math.max(Number.parseInt(raw, 10) || 20, 1), MAX_COUNT);

  try {
    const cards = await fetchRandomCards(count);
    // Never cache: every request must return a freshly randomized deck.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(cards);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch cards from Tatoeba.' });
  }
}
