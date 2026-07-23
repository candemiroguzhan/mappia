import type { Geometry } from 'geojson';

export type MapLayerType = 'vector' | 'raster' | 'cog' | 'geojson' | 'geoparquet' | 'csv' | 'parquet' | 'drawing';

export interface MapLayer {
  id: string;
  name: string;
  type: MapLayerType;
  visible: boolean;
  opacity: number;
  color: string;
  icon: string;
  sourceId?: string;
  layerId?: string;
  tableName?: string;
  fileName?: string;
  featureCount?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ColumnSchema {
  name: string;
  type: string;
}

export interface UploadedTable {
  tableName: string;
  fileName: string;
  duckDbFileName: string;
  sizeBytes: number;
  rowCount: number | null;
  columns: ColumnSchema[];
  registeredAt: string;
  geoHints: string[];
}

export interface QueryError {
  message: string;
  detail?: string;
}

export interface QueryResult {
  columns: ColumnSchema[];
  rows: Record<string, unknown>[];
  totalRows: number;
  elapsedMs: number;
  truncated: boolean;
  error?: QueryError;
  sql: string;
}

export interface DashboardStats {
  totalRows: number | null;
  columnCount: number;
  lastQueryMs: number | null;
  uploadedBytes: number;
  numericSummaries: NumericSummary[];
}

export interface NumericSummary {
  column: string;
  min: number;
  max: number;
  avg: number;
}

export interface MapFeature {
  id: string;
  geometry: Geometry;
  properties: Record<string, unknown>;
}

export interface SchemaContext {
  tables: {
    name: string;
    columns: ColumnSchema[];
  }[];
}

export type MapTool =
  | 'pan'
  | 'select'
  | 'measure-distance'
  | 'measure-area'
  | 'measure-angle'
  | 'draw-point'
  | 'draw-line'
  | 'draw-polygon';

export interface CogMetadata {
  width: number;
  height: number;
  bandCount: number;
  fileSize: number;
  bbox: [number, number, number, number] | null;
  mapCoordinates: [[number, number], [number, number], [number, number], [number, number]] | null;
  imageUrl: string | null;
  projection: string | null;
  warning: string | null;
}
