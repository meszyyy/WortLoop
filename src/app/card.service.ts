import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card } from './card.model';

const DECK_KEY = 'wortloop.deck';
const PAGE_KEY = 'wortloop.page';

/**
 * Loads German→Hungarian cards from the Vercel proxy (`/api/cards`) and keeps the
 * fetched deck in localStorage so previously seen cards stay available offline.
 */
@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly http = inject(HttpClient);

  /** Cards persisted from previous sessions (empty array if none / unavailable). */
  loadCachedDeck(): Card[] {
    try {
      const raw = localStorage.getItem(DECK_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      return Array.isArray(parsed) ? (parsed as Card[]) : [];
    } catch {
      return [];
    }
  }

  /** Last Tatoeba page number that was successfully fetched (0 if none). */
  lastPage(): number {
    const n = Number(localStorage.getItem(PAGE_KEY));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /** Fetch one page of cards from the proxy. */
  fetchPage(page: number): Observable<Card[]> {
    return this.http.get<Card[]>('/api/cards', { params: { page } });
  }

  /**
   * Merge freshly fetched cards into the existing deck (dedup by id), persist the
   * result and the page cursor, and return the combined deck.
   */
  mergeAndSave(existing: Card[], incoming: Card[], page: number): Card[] {
    const seen = new Set(existing.map((c) => c.id));
    const merged = existing.slice();
    for (const card of incoming) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        merged.push(card);
      }
    }
    this.persist(merged, page);
    return merged;
  }

  private persist(deck: Card[], page: number): void {
    try {
      localStorage.setItem(DECK_KEY, JSON.stringify(deck));
      localStorage.setItem(PAGE_KEY, String(page));
    } catch {
      /* localStorage full or unavailable — keep the in-memory deck only. */
    }
  }
}
