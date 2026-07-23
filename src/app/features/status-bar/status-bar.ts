import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MapStatusService } from '../../core/services/map-status.service';
import { ToolService } from '../../core/services/tool.service';
import { LayerStore } from '../../core/stores/layer-store.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [DecimalPipe, IconComponent, TranslatePipe],
  templateUrl: './status-bar.html',
  styleUrl: './status-bar.scss'
})
export class StatusBarComponent {
  protected readonly mapStatus = inject(MapStatusService);
  protected readonly toolService = inject(ToolService);
  protected readonly layerStore = inject(LayerStore);
}
