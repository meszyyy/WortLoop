import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CardComponent } from './card/card';
import { CardService } from './card.service';
import { Card } from './card.model';

type Mode = 'setup' | 'study';

const MAX_COUNT = 100;

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly service = inject(CardService);

  // The app always opens on the count picker — it never resumes a previous deck.
  protected readonly mode = signal<Mode>('setup');
  protected readonly deck = signal<Card[]>([]);
  protected readonly index = signal(0);
  protected readonly flipped = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly presets = [10, 20, 30, 50];
  protected readonly selectedCount = signal(20);

  // Greeting shown on the picker until the user starts their first deck this session.
  protected readonly showWelcome = signal(true);

  protected readonly current = computed<Card | null>(() => this.deck()[this.index()] ?? null);
  protected readonly position = computed(() => {
    const total = this.deck().length;
    return total ? `${this.index() + 1} / ${total}` : '';
  });
  protected readonly isLast = computed(() => this.index() >= this.deck().length - 1);

  protected pick(count: number): void {
    this.selectedCount.set(count);
  }

  protected onCustomCount(event: Event): void {
    const value = Number.parseInt((event.target as HTMLInputElement).value, 10);
    if (Number.isFinite(value)) {
      this.selectedCount.set(Math.min(Math.max(value, 1), MAX_COUNT));
    }
  }

  /** Fetch a fresh random deck of `selectedCount` cards. Used to start and to continue. */
  protected start(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);

    this.service.fetchRandom(this.selectedCount()).subscribe({
      next: (cards) => {
        this.loading.set(false);
        if (!cards.length) {
          this.error.set('Nem érkeztek kártyák, próbáld újra.');
          return;
        }
        this.deck.set(cards);
        this.index.set(0);
        this.flipped.set(false);
        this.showWelcome.set(false);
        this.mode.set('study');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Nem sikerült kártyákat betölteni. Ellenőrizd az internetkapcsolatot, majd próbáld újra.');
      },
    });
  }

  protected flip(): void {
    this.flipped.update((v) => !v);
  }

  protected prev(): void {
    if (this.index() === 0) return;
    this.flipped.set(false);
    this.index.update((i) => i - 1);
  }

  protected next(): void {
    if (this.isLast()) return;
    this.flipped.set(false);
    this.index.update((i) => i + 1);
  }

  /** Return to the count picker. */
  protected restart(): void {
    this.deck.set([]);
    this.index.set(0);
    this.flipped.set(false);
    this.error.set(null);
    this.mode.set('setup');
  }
}
