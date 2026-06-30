import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card } from './card.model';

/** Thin wrapper over the Vercel proxy (`/api/cards`) that returns a random deck. */
@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly http = inject(HttpClient);

  /** Fetch `count` freshly randomized German→Hungarian cards. */
  fetchRandom(count: number): Observable<Card[]> {
    return this.http.get<Card[]>('/api/cards', { params: { count } });
  }
}
