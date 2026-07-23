import { Component, inject, signal } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-top-toolbar',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './top-toolbar.html',
  styleUrl: './top-toolbar.scss'
})
export class TopToolbarComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly languageService = inject(LanguageService);

  protected readonly contactOpen = signal(false);
}
