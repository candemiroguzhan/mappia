import { Component, NgZone, inject, output, signal } from '@angular/core';
import type { FeatureCollection } from 'geojson';
import { CogService } from '../../core/services/cog.service';
import { DuckDbService } from '../../core/services/duck-db.service';
import { LayerMapService } from '../../core/services/layer-map.service';
import { LayerStore } from '../../core/stores/layer-store.service';
import { formatBytes } from '../../shared/formatters';
import { IconComponent } from '../../shared/icon/icon.component';
import { MapLayer, MapLayerType, UploadedTable } from '../../shared/models';
import { TranslatePipe } from '../../shared/translate.pipe';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  templateUrl: './upload.html',
  styleUrl: './upload.scss'
})
export class UploadComponent {
  private readonly duckDb = inject(DuckDbService);
  private readonly layerStore = inject(LayerStore);
  private readonly layerMap = inject(LayerMapService);
  private readonly cogService = inject(CogService);
  private readonly zone = inject(NgZone);

  readonly tableRegistered = output<UploadedTable>();
  protected readonly dragActive = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly remoteCogUrl = signal('');
  protected readonly importMode = signal<'closed' | 'pc' | 'url'>('closed');
  protected readonly formatBytes = formatBytes;

  protected toggleImportMenu(): void {
    this.importMode.update((value) => (value === 'closed' ? 'pc' : 'closed'));
  }

  protected setImportMode(mode: 'pc' | 'url'): void {
    this.importMode.set(mode);
  }

  protected async onFiles(files: FileList | null): Promise<void> {
    if (!files?.length) {
      return;
    }

    for (const file of Array.from(files)) {
      if (!this.isSupported(file)) {
        this.message.set(`Unsupported file: ${file.name}`);
        continue;
      }

      try {
        await this.loadFile(file);
      } catch (error) {
        console.error('Upload failed', error);
        this.message.set(error instanceof Error ? error.message : String(error));
      }
    }
  }

  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    void this.onFiles(input?.files ?? null);
    if (input) {
      input.value = '';
    }
  }

  protected setRemoteCogUrl(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.remoteCogUrl.set(input?.value ?? '');
  }

  protected async loadRemoteCog(): Promise<void> {
    const url = this.remoteCogUrl().trim();
    if (!url) {
      return;
    }

    try {
      const metadata = await this.cogService.loadCogUrl(url);
      const layer = this.createLayer({
        name: this.nameFromPath(url),
        type: 'cog',
        fileName: url,
        metadata: { ...metadata, remote: true }
      });
      this.zone.run(() => {
        this.layerStore.addLayer(layer);
        this.layerMap.addCogLayer(layer);
        this.message.set(`COG metadata loaded from ${url}`);
        this.importMode.set('closed');
      });
    } catch (error) {
      console.error('Remote COG load failed', error);
      this.message.set(error instanceof Error ? error.message : String(error));
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    void this.onFiles(event.dataTransfer?.files ?? null);
  }

  protected setDragState(event: DragEvent, active: boolean): void {
    event.preventDefault();
    this.dragActive.set(active);
  }

  private isSupported(file: File): boolean {
    return /\.(csv|parquet|geoparquet|geojson|json|tif|tiff)$/i.test(file.name);
  }

  private async loadFile(file: File): Promise<void> {
    if (/\.(geojson|json)$/i.test(file.name)) {
      await this.loadGeoJsonFile(file);
      return;
    }

    if (/\.(tif|tiff)$/i.test(file.name)) {
      await this.loadCogFile(file);
      return;
    }

    const table = await this.duckDb.registerFile(file);
    const layer = this.createLayer({
      name: table.tableName,
      type: this.tableLayerType(file.name),
      tableName: table.tableName,
      fileName: file.name,
      featureCount: table.rowCount ?? undefined,
      metadata: {
        columns: table.columns.length,
        sizeBytes: file.size
      }
    });
    this.zone.run(() => {
      this.tableRegistered.emit(table);
      this.layerStore.addLayer(layer);
      this.layerMap.addRasterLayer(layer);
      this.message.set(`${table.tableName} registered from ${file.name}`);
      this.importMode.set('closed');
    });
  }

  private async loadGeoJsonFile(file: File): Promise<void> {
    const parsed = JSON.parse(await file.text()) as unknown;
    const collection = this.toFeatureCollection(parsed);
    if (!collection) {
      throw new Error(`${file.name} is not a valid GeoJSON FeatureCollection or Feature.`);
    }

    const layer = this.createLayer({
      name: this.nameFromPath(file.name),
      type: 'geojson',
      fileName: file.name,
      featureCount: collection.features.length,
      metadata: { sizeBytes: file.size }
    });
    this.zone.run(() => {
      this.layerStore.addLayer(layer);
      this.layerMap.addGeoJsonLayer(layer, collection);
      this.message.set(`${file.name} added as GeoJSON layer`);
      this.importMode.set('closed');
    });
  }

  private async loadCogFile(file: File): Promise<void> {
    const metadata = await this.cogService.loadCogFile(file);
    const layer = this.createLayer({
      name: this.nameFromPath(file.name),
      type: 'cog',
      fileName: file.name,
      metadata: { ...metadata }
    });
    this.zone.run(() => {
      this.layerStore.addLayer(layer);
      this.layerMap.addCogLayer(layer);
      this.message.set(`COG metadata loaded for ${file.name}`);
      this.importMode.set('closed');
    });
  }

  private createLayer(input: {
    name: string;
    type: MapLayerType;
    tableName?: string;
    fileName?: string;
    featureCount?: number;
    metadata?: Record<string, unknown>;
  }): MapLayer {
    const id = `${input.type}-${crypto.randomUUID()}`;
    return {
      id,
      name: input.name,
      type: input.type,
      visible: true,
      opacity: 1,
      color: this.defaultColor(input.type),
      icon: this.defaultIcon(input.type),
      sourceId: `${id}-source`,
      tableName: input.tableName,
      fileName: input.fileName,
      featureCount: input.featureCount,
      metadata: input.metadata,
      createdAt: new Date()
    };
  }

  private toFeatureCollection(value: unknown): FeatureCollection | null {
    if (!value || typeof value !== 'object' || !('type' in value)) {
      return null;
    }

    if (value.type === 'FeatureCollection' && 'features' in value && Array.isArray(value.features)) {
      return value as FeatureCollection;
    }

    if (value.type === 'Feature') {
      return {
        type: 'FeatureCollection',
        features: [value as FeatureCollection['features'][number]]
      };
    }

    return null;
  }

  private tableLayerType(fileName: string): MapLayerType {
    if (/\.geoparquet$/i.test(fileName)) {
      return 'geoparquet';
    }
    if (/\.parquet$/i.test(fileName)) {
      return 'parquet';
    }
    return 'csv';
  }

  private defaultColor(type: MapLayerType): string {
    switch (type) {
      case 'geojson':
      case 'vector':
      case 'geoparquet':
      case 'drawing':
        return '#5fd0c2';
      case 'cog':
      case 'raster':
        return '#78a7ff';
      case 'csv':
      case 'parquet':
        return '#f4c95d';
      default:
        return '#95eadf';
    }
  }

  private defaultIcon(type: MapLayerType): string {
    switch (type) {
      case 'geojson':
      case 'vector':
        return 'fg-layer-alt';
      case 'geoparquet':
      case 'drawing':
        return 'fg-polygon';
      case 'cog':
      case 'raster':
        return 'fg-mosaic';
      case 'csv':
        return 'Table';
      case 'parquet':
        return 'Database';
      default:
        return 'Folder';
    }
  }

  private nameFromPath(value: string): string {
    return value.split(/[\\/]/).pop()?.replace(/\.(geojson|json|cog\.tif|tif|tiff)$/i, '') || value;
  }
}
