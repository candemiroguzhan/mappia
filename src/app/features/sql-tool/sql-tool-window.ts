import { Component, computed, inject, input, output } from '@angular/core';
import type { FeatureCollection } from 'geojson';
import { LayerMapService } from '../../core/services/layer-map.service';
import { MapFeatureService } from '../../core/services/map-feature.service';
import { ToolService } from '../../core/services/tool.service';
import { LayerStore } from '../../core/stores/layer-store.service';
import { QueryError, QueryResult, SchemaContext, UploadedTable } from '../../shared/models';
import { IconComponent } from '../../shared/icon/icon.component';
import { TranslatePipe } from '../../shared/translate.pipe';
import { NaturalLanguageQueryComponent } from '../natural-language-query/natural-language-query';
import { QueryEditorComponent } from '../query-editor/query-editor';
import { ResultsTableComponent } from '../results-table/results-table';
import { SchemaBrowserComponent } from '../schema-browser/schema-browser';

@Component({
  selector: 'app-sql-tool-window',
  standalone: true,
  imports: [IconComponent, NaturalLanguageQueryComponent, QueryEditorComponent, ResultsTableComponent, SchemaBrowserComponent, TranslatePipe],
  templateUrl: './sql-tool-window.html',
  styleUrl: './sql-tool-window.scss'
})
export class SqlToolWindowComponent {
  protected readonly toolService = inject(ToolService);
  private readonly mapFeatureService = inject(MapFeatureService);
  private readonly layerStore = inject(LayerStore);
  private readonly layerMap = inject(LayerMapService);

  readonly sql = input.required<string>();
  readonly busy = input(false);
  readonly history = input<string[]>([]);
  readonly result = input<QueryResult | null>(null);
  readonly error = input<QueryError | null>(null);
  readonly tables = input<UploadedTable[]>([]);
  readonly spatialAvailable = input<boolean | null>(null);
  readonly schemaContext = input.required<SchemaContext>();
  readonly sqlChange = output<string>();
  readonly run = output<void>();

  protected readonly featureCount = computed(() => this.mapFeatureService.toFeatures(this.result()?.rows ?? []).length);

  protected close(): void {
    this.toolService.closeSqlTool();
  }

  protected useTable(table: UploadedTable): void {
    this.sqlChange.emit(`SELECT * FROM "${table.tableName}" LIMIT 100;`);
  }

  protected addResultAsLayer(): void {
    const result = this.result();
    if (!result) {
      return;
    }

    const features = this.mapFeatureService.toFeatures(result.rows);
    if (features.length === 0) {
      return;
    }

    const id = `query-${crypto.randomUUID()}`;
    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features: features.map((feature) => ({
        type: 'Feature',
        id: feature.id,
        geometry: feature.geometry,
        properties: feature.properties
      }))
    };

    const layer = {
      id,
      name: `Query result ${this.layerStore.layers().length + 1}`,
      type: 'geojson' as const,
      visible: true,
      opacity: 1,
      color: '#5fd0c2',
      icon: 'fg-layer-alt',
      sourceId: `${id}-source`,
      featureCount: features.length,
      metadata: { sql: result.sql },
      createdAt: new Date()
    };

    this.layerStore.addLayer(layer);
    this.layerMap.addGeoJsonLayer(layer, collection);
  }
}
