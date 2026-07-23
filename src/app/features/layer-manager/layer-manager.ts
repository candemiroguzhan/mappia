import { DecimalPipe } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { LayerMapService } from '../../core/services/layer-map.service';
import { LayerStore } from '../../core/stores/layer-store.service';
import { formatBytes } from '../../shared/formatters';
import { MapLayer, UploadedTable } from '../../shared/models';
import { IconComponent, IconLibrary } from '../../shared/icon/icon.component';
import { TranslatePipe } from '../../shared/translate.pipe';
import { UploadComponent } from '../upload/upload';

@Component({
  selector: 'app-layer-manager',
  standalone: true,
  imports: [DecimalPipe, IconComponent, TranslatePipe, UploadComponent],
  templateUrl: './layer-manager.html',
  styleUrl: './layer-manager.scss'
})
export class LayerManagerComponent {
  protected readonly layerStore = inject(LayerStore);
  private readonly layerMap = inject(LayerMapService);
  protected readonly formatBytes = formatBytes;
  readonly close = output<void>();
  readonly tableRegistered = output<UploadedTable>();

  protected readonly colorOptions = ['#5fd0c2', '#78a7ff', '#f4c95d', '#ff8f70', '#b79cff', '#7bd88f'];
  protected readonly iconOptions: { library: IconLibrary; name: string; label: string }[] = [
    { library: 'fontgis', name: 'fg-layer-alt', label: 'Layer' },
    { library: 'fontgis', name: 'fg-polygon', label: 'Polygon' },
    { library: 'fontgis', name: 'fg-mosaic', label: 'Raster' },
    { library: 'lucide', name: 'Table', label: 'Table' },
    { library: 'lucide', name: 'Database', label: 'Database' },
    { library: 'lucide', name: 'Folder', label: 'Folder' }
  ];

  protected metadataNumber(value: unknown): number {
    return typeof value === 'number' ? value : 0;
  }

  protected layerIcon(layer: MapLayer): { library: IconLibrary; name: string } {
    if (layer.icon) {
      return {
        library: layer.icon.startsWith('fg-') ? 'fontgis' : 'lucide',
        name: layer.icon
      };
    }

    switch (layer.type) {
      case 'geojson':
      case 'vector':
        return { library: 'fontgis', name: 'fg-layer-alt' };
      case 'geoparquet':
      case 'drawing':
        return { library: 'fontgis', name: 'fg-polygon' };
      case 'cog':
      case 'raster':
        return { library: 'fontgis', name: 'fg-mosaic' };
      case 'csv':
        return { library: 'lucide', name: 'Table' };
      case 'parquet':
        return { library: 'lucide', name: 'Database' };
      default:
        return { library: 'lucide', name: 'Folder' };
    }
  }

  protected toggleLayer(layerId: string): void {
    const layer = this.layerStore.toggleVisibility(layerId);
    if (layer) {
      this.layerMap.setLayerVisibility(layer.id, layer.visible);
    }
  }

  protected setOpacity(layerId: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const layer = this.layerStore.setOpacity(layerId, Number(input?.value ?? 1));
    if (layer) {
      this.layerMap.setLayerOpacity(layer.id, layer.opacity);
    }
  }

  protected setColor(layerId: string, color: string): void {
    const layer = this.layerStore.setColor(layerId, color);
    if (layer) {
      this.layerMap.setLayerColor(layer.id, layer.color);
    }
  }

  protected setIcon(layerId: string, icon: string): void {
    this.layerStore.setIcon(layerId, icon);
  }

  protected renameLayer(layerId: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.layerStore.renameLayer(layerId, input?.value ?? '');
  }

  protected removeLayer(layerId: string): void {
    this.layerMap.removeLayer(layerId);
    this.layerStore.removeLayer(layerId);
  }

  protected zoomToLayer(layerId: string): void {
    this.layerMap.fitToLayer(layerId);
  }

  protected canExport(layer: MapLayer): boolean {
    return Boolean(layer.metadata?.['geojson']);
  }

  protected exportLayer(layer: MapLayer): void {
    const geojson = layer.metadata?.['geojson'];
    if (!geojson) {
      return;
    }

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.fileSafeName(layer.name)}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private fileSafeName(value: string): string {
    return value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'layer';
  }
}
