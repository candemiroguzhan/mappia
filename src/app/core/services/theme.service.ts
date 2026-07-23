import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type AppTheme = 'day' | 'night';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<AppTheme>('night');

  constructor() {
    effect(() => {
      const body = this.document.body;
      body.classList.toggle('theme-day', this.theme() === 'day');
      body.classList.toggle('theme-night', this.theme() === 'night');
    });
  }

  toggleTheme(): void {
    this.theme.update((value) => (value === 'night' ? 'day' : 'night'));
  }
}
