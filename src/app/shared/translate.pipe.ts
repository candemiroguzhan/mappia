import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../core/services/language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly languageService = inject(LanguageService);

  transform(key: Parameters<LanguageService['translate']>[0]): string {
    return this.languageService.translate(key);
  }
}
