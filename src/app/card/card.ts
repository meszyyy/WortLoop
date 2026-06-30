import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Card } from '../card.model';

/** Presentational flip card: German on the front, Hungarian on the back. */
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class CardComponent {
  readonly card = input.required<Card>();
  readonly flipped = input(false);
  readonly toggle = output<void>();
}
