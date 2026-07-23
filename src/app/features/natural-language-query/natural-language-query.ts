import { Component, input, output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NaturalLanguageQueryService } from '../../core/services/natural-language-query.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { SchemaContext } from '../../shared/models';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-natural-language-query',
  standalone: true,
  imports: [FormsModule, IconComponent, TranslatePipe],
  templateUrl: './natural-language-query.html',
  styleUrl: './natural-language-query.scss'
})
export class NaturalLanguageQueryComponent {
  private readonly nlQuery = inject(NaturalLanguageQueryService);

  readonly schema = input.required<SchemaContext>();
  readonly sqlGenerated = output<string>();

  protected readonly prompt = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async generateSql(): Promise<void> {
    const prompt = this.prompt().trim();
    if (!prompt) {
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    try {
      const sql = await this.nlQuery.translateToSql(prompt, this.schema());
      this.sqlGenerated.emit(sql);
    } catch (error) {
      console.error('Natural language query failed', error);
      this.error.set(error instanceof Error ? error.message : 'Could not generate SQL.');
    } finally {
      this.busy.set(false);
    }
  }
}
