// Local stand-in for the Vercel function so `ng serve` works end-to-end without
// the Vercel CLI. Angular's proxy.conf.json forwards /api here.

import { createServer } from 'node:http';
import { fetchRandomCards, MAX_COUNT } from '../api/_tatoeba.mjs';

const PORT = Number(process.env.DEV_API_PORT) || 3001;

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/cards') {
    const count = Math.min(
      Math.max(Number.parseInt(url.searchParams.get('count'), 10) || 20, 1),
      MAX_COUNT,
    );
    try {
      const cards = await fetchRandomCards(count);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(cards));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch cards from Tatoeba.' }));
    }
    return;
  }

  res.writeHead(404);
  res.end();
}).listen(PORT, () => {
  console.log(`[dev-api] serving http://localhost:${PORT}/api/cards`);
});
