import { Component, computed, inject, signal } from '@angular/core';
import { DuckDbService } from './core/services/duck-db.service';
import { AiToolsPanelComponent } from './features/ai-tools/ai-tools-panel';
import { LayerMapService } from './core/services/layer-map.service';
import { LayerManagerComponent } from './features/layer-manager/layer-manager';
import { MapViewComponent } from './features/map-view/map-view';
import { MeasurementToolsPanelComponent } from './features/measurement-tools/measurement-tools-panel';
import { SqlToolWindowComponent } from './features/sql-tool/sql-tool-window';
import { StatusBarComponent } from './features/status-bar/status-bar';
import { ToolsPanelComponent } from './features/tools/tools-panel';
import { TopToolbarComponent } from './features/top-toolbar/top-toolbar';
import { IconComponent } from './shared/icon/icon.component';
import { TranslatePipe } from './shared/translate.pipe';
import { DraggableWindowDirective } from './shared/draggable-window.directive';
import { UploadedTable } from './shared/models';
import { ToolService } from './core/services/tool.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    DraggableWindowDirective,
    AiToolsPanelComponent,
    IconComponent,
    LayerManagerComponent,
    MapViewComponent,
    MeasurementToolsPanelComponent,
    SqlToolWindowComponent,
    StatusBarComponent,
    TranslatePipe,
    ToolsPanelComponent,
    TopToolbarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  protected readonly duckDb = inject(DuckDbService);
  private readonly layerMap = inject(LayerMapService);
  protected readonly toolService = inject(ToolService);
  protected readonly sql = signal('SELECT * FROM table_name LIMIT 100;');
  protected readonly layerManagerOpen = signal(false);
  protected readonly toolsOpen = signal(false);
  protected readonly measurementToolsOpen = signal(false);
  protected readonly aiToolsOpen = signal(false);

  protected readonly status = computed(() => {
    if (this.duckDb.initializing()) {
      return 'DuckDB WASM initializing';
    }
    if (this.duckDb.busy()) {
      return 'Running';
    }
    return 'Ready';
  });

  protected async runQuery(): Promise<void> {
    try {
      await this.duckDb.query(this.sql());
    } catch (error) {
      console.error('Query failed', error);
    }
  }

  protected useTable(table: UploadedTable): void {
    this.sql.set(`SELECT * FROM "${table.tableName}" LIMIT 100;`);
  }

  protected useSnippet(snippet: string): void {
    this.sql.set(snippet);
  }

  protected toggleLayerManager(): void {
    this.layerManagerOpen.update((value) => !value);
  }

  protected activatePan(): void {
    this.toolService.deactivateTool();
  }

  protected toggleTools(): void {
    const next = !this.toolsOpen();
    this.toolsOpen.set(next);
    if (next) {
      this.measurementToolsOpen.set(false);
      this.aiToolsOpen.set(false);
    }
  }

  protected toggleAiTools(): void {
    const next = !this.aiToolsOpen();
    this.aiToolsOpen.set(next);
    if (next) {
      this.toolsOpen.set(false);
      this.measurementToolsOpen.set(false);
    }
  }

  protected toggleMeasurementTools(): void {
    const next = !this.measurementToolsOpen();
    this.measurementToolsOpen.set(next);
    if (next) {
      this.toolsOpen.set(false);
      this.aiToolsOpen.set(false);
    }
  }

  protected fitView(): void {
    this.layerMap.fitToAllLayers();
  }

  protected resetView(): void {
    this.layerMap.resetView();
  }
}
