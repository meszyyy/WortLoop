import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CardComponent } from './card/card';
import { CardService } from './card.service';
import { Card } from './card.model';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly service = inject(CardService);

  protected readonly deck = signal<Card[]>([]);
  protected readonly index = signal(0);
  protected readonly flipped = signal(false);
  protected readonly loading = signal(false);
  protected readonly message = signal<string | null>(null);
  private page = 0;

  protected readonly current = computed<Card | null>(() => this.deck()[this.index()] ?? null);
  protected readonly position = computed(() => {
    const total = this.deck().length;
    return total ? `${this.index() + 1} / ${total}` : '';
  });

  ngOnInit(): void {
    const cached = this.service.loadCachedDeck();
    if (cached.length) {
      this.deck.set(cached);
      this.page = this.service.lastPage();
    } else {
      this.loadMore();
    }
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
    this.flipped.set(false);
    if (this.index() + 1 < this.deck().length) {
      this.index.update((i) => i + 1);
    } else {
      this.loadMore(true);
    }
  }

  protected loadMore(advance = false): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.message.set(null);

    this.service.fetchPage(this.page + 1).subscribe({
      next: (cards) => {
        this.page += 1;
        const before = this.deck().length;
        const merged = this.service.mergeAndSave(this.deck(), cards, this.page);
        this.deck.set(merged);
        this.loading.set(false);
        if (advance && merged.length > before) {
          this.index.update((i) => Math.min(i + 1, merged.length - 1));
        }
        if (merged.length === before) {
          this.message.set('Nincs több új kártya egyelőre.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.message.set(
          this.deck().length
            ? 'Nincs internet — új kártyák nem tölthetők, a meglévők lapozhatók.'
            : 'Nem sikerült kártyákat betölteni. Ellenőrizd az internetkapcsolatot, majd próbáld újra.',
        );
      },
    });
  }
}
