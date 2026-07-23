import { Injectable } from '@angular/core';
import type { Feature, Geometry } from 'geojson';
import { MapFeature } from '../../shared/models';
import { parseWkt } from './wkt-parser';

const GEOMETRY_COLUMNS = ['geometry', 'geom', 'wkt', 'geojson', 'coordinates'];
const GEOMETRY_TYPES = new Set<Geometry['type']>([
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection'
]);

function isGeoJsonGeometry(value: unknown): value is Geometry {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    typeof value.type === 'string' &&
    GEOMETRY_TYPES.has(value.type as Geometry['type'])
  );
}

function isGeoJsonFeature(value: unknown): value is Feature {
  return value !== null && typeof value === 'object' && 'type' in value && value.type === 'Feature' && 'geometry' in value;
}

@Injectable({ providedIn: 'root' })
export class MapFeatureService {
  readonly featureLimit = 5000;

  detectGeometryColumn(rows: Record<string, unknown>[]): string | null {
    const first = rows[0];
    if (!first) {
      return null;
    }

    const columns = Object.keys(first);
    return (
      columns.find((column) => GEOMETRY_COLUMNS.includes(column.toLowerCase())) ??
      columns.find((column) => GEOMETRY_COLUMNS.some((candidate) => column.toLowerCase().includes(candidate))) ??
      null
    );
  }

  toFeatures(rows: Record<string, unknown>[]): MapFeature[] {
    const geometryColumn = this.detectGeometryColumn(rows);
    if (!geometryColumn) {
      return [];
    }

    return rows
      .slice(0, this.featureLimit)
      .map((row, index) => this.rowToFeature(row, geometryColumn, index))
      .filter((feature): feature is MapFeature => feature !== null);
  }

  private rowToFeature(row: Record<string, unknown>, geometryColumn: string, index: number): MapFeature | null {
    const value = row[geometryColumn];
    const geometry = this.parseGeometryValue(value);
    if (!geometry) {
      return null;
    }

    const properties = { ...row };
    delete properties[geometryColumn];
    return {
      id: `${index}`,
      geometry,
      properties
    };
  }

  private parseGeometryValue(value: unknown): Geometry | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed) as unknown;
        if (isGeoJsonFeature(parsed)) {
          return parsed.geometry;
        }
        return isGeoJsonGeometry(parsed) ? parsed : null;
      }

      if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed) as [number, number];
        return { type: 'Point', coordinates: parsed };
      }

      return parseWkt(trimmed);
    }

    if (Array.isArray(value) && value.length >= 2) {
      return { type: 'Point', coordinates: [Number(value[0]), Number(value[1])] };
    }

    if (isGeoJsonGeometry(value)) {
      return value;
    }

    return null;
  }
}
