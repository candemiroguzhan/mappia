import { Component, inject, output } from '@angular/core';
import { ToolService } from '../../core/services/tool.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-ai-tools-panel',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './ai-tools-panel.html',
  styleUrl: './ai-tools-panel.scss'
})
export class AiToolsPanelComponent {
  private readonly toolService = inject(ToolService);

  readonly close = output<void>();

  protected openSql(): void {
    this.toolService.openSqlTool();
  }
}
