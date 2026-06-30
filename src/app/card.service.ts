import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card } from './card.model';

const DECK_KEY = 'wortloop.deck';
const INDEX_KEY = 'wortloop.index';

/**
 * Fetches a random German→Hungarian deck from the Vercel proxy (`/api/cards`) and
 * persists the current session's deck + position so a reload resumes the same set.
 */
@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly http = inject(HttpClient);

  /** Fetch `count` freshly randomized cards. */
  fetchRandom(count: number): Observable<Card[]> {
    return this.http.get<Card[]>('/api/cards', { params: { count } });
  }

  /** Deck persisted from the current session (empty if none / unavailable). */
  loadCachedDeck(): Card[] {
    try {
      const raw = localStorage.getItem(DECK_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      return Array.isArray(parsed) ? (parsed as Card[]) : [];
    } catch {
      return [];
    }
  }

  /** Last viewed card index (0 if none / invalid). */
  loadIndex(): number {
    const n = Number(localStorage.getItem(INDEX_KEY));
    return Number.isInteger(n) && n >= 0 ? n : 0;
  }

  saveDeck(deck: Card[]): void {
    this.safeSet(DECK_KEY, JSON.stringify(deck));
  }

  saveIndex(index: number): void {
    this.safeSet(INDEX_KEY, String(index));
  }

  /** Drop the persisted session (used when starting a new deck). */
  clear(): void {
    try {
      localStorage.removeItem(DECK_KEY);
      localStorage.removeItem(INDEX_KEY);
    } catch {
      /* ignore */
    }
  }

  private safeSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* localStorage full or unavailable — keep the in-memory state only. */
    }
  }
}
