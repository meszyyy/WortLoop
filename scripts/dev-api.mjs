// Local stand-in for the Vercel function so `ng serve` works end-to-end without
// the Vercel CLI. Angular's proxy.conf.json forwards /api here.

import { createServer } from 'node:http';
import { fetchCards } from '../api/_tatoeba.mjs';

const PORT = Number(process.env.DEV_API_PORT) || 3001;

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/cards') {
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page'), 10) || 1);
    try {
      const cards = await fetchCards(page);
      res.writeHead(200, { 'Content-Type': 'application/json' });
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
