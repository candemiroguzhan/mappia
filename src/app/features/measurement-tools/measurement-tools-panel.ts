import { Component, inject, output } from '@angular/core';
import { LayerMapService } from '../../core/services/layer-map.service';
import { ToolService } from '../../core/services/tool.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { MapTool } from '../../shared/models';
import { TranslatePipe } from '../../shared/translate.pipe';

interface MeasurementToolButton {
  id: MapTool;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-measurement-tools-panel',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './measurement-tools-panel.html',
  styleUrl: './measurement-tools-panel.scss'
})
export class MeasurementToolsPanelComponent {
  protected readonly toolService = inject(ToolService);
  private readonly layerMap = inject(LayerMapService);

  readonly close = output<void>();

  protected readonly tools: MeasurementToolButton[] = [
    { id: 'measure-distance', label: 'Measure Distance', icon: 'Ruler' },
    { id: 'measure-area', label: 'Measure Area', icon: 'SquareDashed' },
    { id: 'measure-angle', label: 'Measure Angle', icon: 'Move' }
  ];

  protected setTool(tool: MapTool): void {
    this.toolService.setActiveTool(tool);
    this.toolService.setMeasurement(null);
    this.layerMap.clearDrawings();
  }

  protected clearMeasurement(): void {
    this.layerMap.clearDrawings();
    this.toolService.setMeasurement(null);
    this.toolService.deactivateTool();
  }

  protected closePanel(): void {
    this.clearMeasurement();
    this.close.emit();
  }
}
