import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

export type IconLibrary = 'lucide' | 'fontgis';
export type IconSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
  readonly library = input.required<IconLibrary>();
  readonly name = input.required<string>();
  readonly size = input<IconSize>('md');
  readonly label = input<string | null>(null);

  protected readonly iconClass = computed(() => `app-icon app-icon-${this.size()}`);
  protected readonly fontGisClass = computed(() => `${this.iconClass()} ${this.name()}`);
  protected readonly lucideName = computed(() => this.normalizeLucideName(this.name()));

  private normalizeLucideName(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
      .replace(/([a-zA-Z])(\d)/g, '$1-$2')
      .replace(/_/g, '-')
      .toLowerCase();
  }
}
