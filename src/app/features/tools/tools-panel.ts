import { Component, inject, output } from '@angular/core';
import { LayerMapService } from '../../core/services/layer-map.service';
import { LayerStore } from '../../core/stores/layer-store.service';
import { ToolService } from '../../core/services/tool.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { MapTool } from '../../shared/models';
import { TranslatePipe } from '../../shared/translate.pipe';

interface ToolButton {
  id: MapTool;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-tools-panel',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './tools-panel.html',
  styleUrl: './tools-panel.scss'
})
export class ToolsPanelComponent {
  protected readonly toolService = inject(ToolService);
  protected readonly layerMap = inject(LayerMapService);
  private readonly layerStore = inject(LayerStore);
  readonly close = output<void>();

  protected readonly tools: ToolButton[] = [
    { id: 'draw-point', label: 'Draw Point', icon: 'Circle' },
    { id: 'draw-line', label: 'Draw Line', icon: 'Slash' },
    { id: 'draw-polygon', label: 'Draw Polygon', icon: 'Pentagon' }
  ];

  protected setTool(tool: MapTool): void {
    this.toolService.setActiveTool(tool);
    this.toolService.setMeasurement(null);
    this.layerMap.clearDrawings();
  }

  protected canSaveDrawings(): boolean {
    const activeTool = this.toolService.activeTool();
    return activeTool.startsWith('draw-') && this.layerMap.drawingCount() > 0;
  }

  protected clearDrawings(): void {
    this.layerMap.clearDrawings();
    this.toolService.setMeasurement(null);
    this.toolService.deactivateTool();
  }

  protected closePanel(): void {
    this.clearDrawings();
    this.close.emit();
  }

  protected saveDrawingsAsLayer(): void {
    const collection = this.layerMap.getDrawingCollection();
    if (collection.features.length === 0) {
      return;
    }

    const id = `drawing-${crypto.randomUUID()}`;
    const layer = {
      id,
      name: `Drawing ${this.layerStore.layers().filter((item) => item.type === 'drawing').length + 1}`,
      type: 'drawing' as const,
      visible: true,
      opacity: 1,
      color: '#ffdf7e',
      icon: 'fg-polygon',
      sourceId: `${id}-source`,
      featureCount: collection.features.length,
      metadata: { geojson: collection },
      createdAt: new Date()
    };

    this.layerStore.addLayer(layer);
    this.layerMap.addGeoJsonLayer(layer, collection);
    this.layerMap.clearDrawings();
    this.toolService.setMeasurement(null);
  }
}
