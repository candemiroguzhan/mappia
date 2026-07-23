import { Injectable, signal } from '@angular/core';
import { MapTool } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ToolService {
  readonly activeTool = signal<MapTool>('pan');
  readonly sqlToolOpen = signal(false);
  readonly lastMeasurement = signal<string | null>(null);

  setActiveTool(tool: MapTool): void {
    this.activeTool.set(tool);
  }

  deactivateTool(): void {
    this.activeTool.set('pan');
  }

  openSqlTool(): void {
    this.sqlToolOpen.set(true);
  }

  closeSqlTool(): void {
    this.sqlToolOpen.set(false);
  }

  setMeasurement(value: string | null): void {
    this.lastMeasurement.set(value);
  }
}
