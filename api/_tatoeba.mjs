// Shared helper (the leading underscore keeps Vercel from exposing it as a route).
// Fetches German sentences that have a Hungarian translation from the Tatoeba API
// and maps them to compact { id, de, hu } cards.

const TATOEBA_SEARCH = 'https://tatoeba.org/en/api_v0/search';

/**
 * @param {number} page 1-based page number
 * @returns {Promise<Array<{ id: number, de: string, hu: string }>>}
 */
export async function fetchCards(page = 1) {
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
  return cards;
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
