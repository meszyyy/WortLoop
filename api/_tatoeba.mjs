// Shared helper (the leading underscore keeps Vercel from exposing it as a route).
// Pulls German sentences that have a Hungarian translation from the Tatoeba API
// and returns a freshly shuffled set of compact { id, de, hu } cards.

const TATOEBA_SEARCH = 'https://tatoeba.org/en/api_v0/search';
const PER_PAGE = 10; // Tatoeba's default page size
export const MAX_COUNT = 100;

/**
 * Fetch `count` random German→Hungarian cards. Tatoeba's `sort=random` reshuffles
 * on every request, and we also hit random pages, so each call yields a fresh deck.
 *
 * @param {number} count desired number of cards (1..MAX_COUNT)
 * @returns {Promise<Array<{ id: number, de: string, hu: string }>>}
 */
export async function fetchRandomCards(count = 20) {
  const target = clamp(Math.trunc(Number(count)) || 1, 1, MAX_COUNT);

  // First request seeds the deck and tells us how many pages exist.
  const first = await fetchPage(randomInt(1, 50));
  const byId = new Map();
  addCards(byId, first.cards);

  const maxPage = clamp(first.pageCount || 1, 1, 200);
  const maxRequests = Math.ceil(target / PER_PAGE) + 8; // safety net against thin result sets
  let requests = 1;

  while (byId.size < target && requests < maxRequests) {
    const need = Math.ceil((target - byId.size) / PER_PAGE) + 1;
    const pages = Array.from({ length: need }, () => randomInt(1, maxPage));
    const batches = await Promise.all(pages.map((p) => fetchPage(p)));
    for (const batch of batches) addCards(byId, batch.cards);
    requests += pages.length;
  }

  return shuffle([...byId.values()]).slice(0, target);
}

async function fetchPage(page) {
  const params = new URLSearchParams({
    from: 'deu',
    to: 'hun',
    trans_to: 'hun',
    trans_filter: 'limit',
    trans_link: 'direct',
    sort: 'random',
    page: String(page),
  });

  const res = await fetch(`${TATOEBA_SEARCH}?${params}`, {
    headers: {
      'User-Agent': 'WortLoop/1.0 (German-Hungarian flashcards)',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Tatoeba responded with ${res.status}`);
  }

  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  const cards = [];
  for (const result of results) {
    const hu = findHungarian(result?.translations);
    if (result?.id != null && result?.text && hu) {
      cards.push({ id: result.id, de: result.text, hu });
    }
  }
  return { cards, pageCount: data?.paging?.pageCount ?? 1 };
}

/** Tatoeba nests translations as a 2D array; find the first Hungarian one. */
function findHungarian(translations) {
  if (!Array.isArray(translations)) return null;
  for (const group of translations) {
    const entries = Array.isArray(group) ? group : [group];
    for (const t of entries) {
      if (t && t.lang === 'hun' && t.text) return t.text;
    }
  }
  return null;
}

function addCards(byId, cards) {
  for (const card of cards) byId.set(card.id, card);
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Fisher–Yates shuffle (returns the same array, shuffled in place). */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
