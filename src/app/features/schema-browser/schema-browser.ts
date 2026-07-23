import { Component, input, output } from '@angular/core';
import { UploadedTable } from '../../shared/models';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-schema-browser',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './schema-browser.html',
  styleUrl: './schema-browser.scss'
})
export class SchemaBrowserComponent {
  readonly tables = input.required<UploadedTable[]>();
  readonly spatialAvailable = input<boolean | null>(null);
  readonly tableSelected = output<UploadedTable>();
  readonly snippetSelected = output<string>();
}
