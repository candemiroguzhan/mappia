import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { formatCell } from '../../shared/formatters';
import { QueryError, QueryResult } from '../../shared/models';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-results-table',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './results-table.html',
  styleUrl: './results-table.scss'
})
export class ResultsTableComponent {
  readonly result = input<QueryResult | null>(null);
  readonly busy = input(false);
  readonly error = input<QueryError | null>(null);
  protected readonly formatCell = formatCell;
}
