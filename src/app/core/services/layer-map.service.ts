import { Injectable, signal } from '@angular/core';
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import maplibregl, { GeoJSONSource, LngLatBounds, LngLatBoundsLike, Map as MapLibreMap } from 'maplibre-gl';
import { CogMetadata, MapLayer } from '../../shared/models';

interface RegisteredMapLayer {
  sourceId: string;
  layerIds: string[];
  bounds: LngLatBoundsLike | null;
}

@Injectable({ providedIn: 'root' })
export class LayerMapService {
  private map: MapLibreMap | null = null;
  private readonly registeredLayers = new Map<string, RegisteredMapLayer>();
  private readonly pendingGeoJsonLayers: { layer: MapLayer; data: FeatureCollection }[] = [];
  private readonly pendingCogLayers: MapLayer[] = [];
  private readonly drawingSourceId = 'spatilab-drawings';
  private readonly previewSourceId = 'spatilab-query-preview';
  private drawings: Feature[] = [];

  readonly mapReady = signal(false);
  readonly drawingCount = signal(0);

  registerMap(map: MapLibreMap): void {
    this.map = map;
    this.mapReady.set(true);
    this.ensureDrawingLayers();
    this.ensurePreviewLayers();

    for (const pending of this.pendingGeoJsonLayers.splice(0)) {
      this.addGeoJsonLayer(pending.layer, pending.data);
    }

    for (const pending of this.pendingCogLayers.splice(0)) {
      this.addCogLayer(pending);
    }
  }

  addGeoJsonLayer(layer: MapLayer, data: FeatureCollection): void {
    if (!this.mapReady() || !this.map) {
      this.pendingGeoJsonLayers.push({ layer, data });
      return;
    }

    this.removeLayer(layer.id);

    const sourceId = layer.sourceId ?? `${layer.id}-source`;
    this.map.addSource(sourceId, {
      type: 'geojson',
      data
    });

    const fillLayerId = `${layer.id}-fill`;
    const lineLayerId = `${layer.id}-line`;
    const pointLayerId = `${layer.id}-point`;

    this.map.addLayer({
      id: fillLayerId,
      type: 'fill',
      source: sourceId,
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
      layout: { visibility: layer.visible ? 'visible' : 'none' },
      paint: {
        'fill-color': layer.color,
        'fill-opacity': layer.opacity * 0.32
      }
    });

    this.map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: sourceId,
      filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']]],
      layout: { visibility: layer.visible ? 'visible' : 'none' },
      paint: {
        'line-color': layer.color,
        'line-opacity': layer.opacity,
        'line-width': 2
      }
    });

    this.map.addLayer({
      id: pointLayerId,
      type: 'circle',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Point'],
      layout: { visibility: layer.visible ? 'visible' : 'none' },
      paint: {
        'circle-color': layer.color,
        'circle-opacity': layer.opacity,
        'circle-radius': 5,
        'circle-stroke-color': '#101317',
        'circle-stroke-opacity': layer.opacity,
        'circle-stroke-width': 1
      }
    });

    this.registeredLayers.set(layer.id, {
      sourceId,
      layerIds: [fillLayerId, lineLayerId, pointLayerId],
      bounds: this.computeBounds(data)
    });
  }

  addRasterLayer(layer: MapLayer): void {
    this.registeredLayers.set(layer.id, {
      sourceId: layer.sourceId ?? `${layer.id}-source`,
      layerIds: layer.layerId ? [layer.layerId] : [],
      bounds: null
    });
  }

  addCogLayer(layer: MapLayer): void {
    const metadata = this.cogMetadata(layer);
    if (!this.mapReady() || !this.map) {
      this.pendingCogLayers.push(layer);
      return;
    }

    if (!metadata?.imageUrl || !metadata.mapCoordinates) {
      this.addRasterLayer(layer);
      return;
    }

    this.removeLayer(layer.id);

    const sourceId = layer.sourceId ?? `${layer.id}-source`;
    const layerId = layer.layerId ?? `${layer.id}-raster`;
    this.map.addSource(sourceId, {
      type: 'image',
      url: metadata.imageUrl,
      coordinates: metadata.mapCoordinates
    });

    this.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      layout: { visibility: layer.visible ? 'visible' : 'none' },
      paint: {
        'raster-opacity': layer.opacity
      }
    });

    this.registeredLayers.set(layer.id, {
      sourceId,
      layerIds: [layerId],
      bounds: this.boundsFromCoordinates(metadata.mapCoordinates)
    });
  }

  setQueryPreview(data: FeatureCollection): void {
    if (!this.mapReady() || !this.map) {
      return;
    }

    this.ensurePreviewLayers();
    const source = this.map.getSource(this.previewSourceId) as GeoJSONSource | undefined;
    source?.setData(data);

    const bounds = this.computeBounds(data);
    if (bounds) {
      this.map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 450 });
    }
  }

  removeLayer(layerId: string): void {
    if (!this.map) {
      this.pendingGeoJsonLayers.splice(
        0,
        this.pendingGeoJsonLayers.length,
        ...this.pendingGeoJsonLayers.filter((pending) => pending.layer.id !== layerId)
      );
      this.pendingCogLayers.splice(
        0,
        this.pendingCogLayers.length,
        ...this.pendingCogLayers.filter((pending) => pending.id !== layerId)
      );
      this.registeredLayers.delete(layerId);
      return;
    }

    const registered = this.registeredLayers.get(layerId);
    if (!registered) {
      return;
    }

    for (const mapLayerId of [...registered.layerIds].reverse()) {
      if (this.map.getLayer(mapLayerId)) {
        this.map.removeLayer(mapLayerId);
      }
    }

    if (this.map.getSource(registered.sourceId)) {
      this.map.removeSource(registered.sourceId);
    }

    this.registeredLayers.delete(layerId);
  }

  setLayerVisibility(layerId: string, visible: boolean): void {
    const registered = this.registeredLayers.get(layerId);
    if (!this.map || !registered) {
      return;
    }

    for (const mapLayerId of registered.layerIds) {
      if (this.map.getLayer(mapLayerId)) {
        this.map.setLayoutProperty(mapLayerId, 'visibility', visible ? 'visible' : 'none');
      }
    }
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    const registered = this.registeredLayers.get(layerId);
    if (!this.map || !registered) {
      return;
    }

    const normalized = Math.min(1, Math.max(0, opacity));
    for (const mapLayerId of registered.layerIds) {
      const layer = this.map.getLayer(mapLayerId);
      if (!layer) {
        continue;
      }

      if (layer.type === 'fill') {
        this.map.setPaintProperty(mapLayerId, 'fill-opacity', normalized * 0.32);
      } else if (layer.type === 'line') {
        this.map.setPaintProperty(mapLayerId, 'line-opacity', normalized);
      } else if (layer.type === 'circle') {
        this.map.setPaintProperty(mapLayerId, 'circle-opacity', normalized);
        this.map.setPaintProperty(mapLayerId, 'circle-stroke-opacity', normalized);
      } else if (layer.type === 'raster') {
        this.map.setPaintProperty(mapLayerId, 'raster-opacity', normalized);
      }
    }
  }

  setLayerColor(layerId: string, color: string): void {
    const registered = this.registeredLayers.get(layerId);
    if (!this.map || !registered) {
      return;
    }

    for (const mapLayerId of registered.layerIds) {
      const layer = this.map.getLayer(mapLayerId);
      if (!layer) {
        continue;
      }

      if (layer.type === 'fill') {
        this.map.setPaintProperty(mapLayerId, 'fill-color', color);
      } else if (layer.type === 'line') {
        this.map.setPaintProperty(mapLayerId, 'line-color', color);
      } else if (layer.type === 'circle') {
        this.map.setPaintProperty(mapLayerId, 'circle-color', color);
      }
    }
  }

  fitToLayer(layerId: string): void {
    const bounds = this.registeredLayers.get(layerId)?.bounds;
    if (this.map && bounds) {
      this.map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 500 });
    }
  }

  fitToAllLayers(): void {
    if (!this.map) {
      return;
    }

    const bounds = [...this.registeredLayers.values()]
      .map((entry) => entry.bounds)
      .filter((entry): entry is LngLatBoundsLike => entry !== null)
      .reduce<LngLatBounds | null>((combined, current) => {
        const next = LngLatBounds.convert(current);
        if (!combined) {
          return next;
        }
        combined.extend(next.getSouthWest());
        combined.extend(next.getNorthEast());
        return combined;
      }, null);

    if (bounds) {
      this.map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 500 });
    }
  }

  resetView(): void {
    this.map?.flyTo({ center: [29, 39], zoom: 4, duration: 500 });
  }

  addDrawingFeature(feature: Feature): void {
    this.drawings = [...this.drawings, feature];
    this.drawingCount.set(this.drawings.length);
    this.updateDrawingSource();
  }

  replaceDrawings(features: Feature[]): void {
    this.drawings = features;
    this.drawingCount.set(this.drawings.length);
    this.updateDrawingSource();
  }

  clearDrawings(): void {
    this.drawings = [];
    this.drawingCount.set(0);
    this.updateDrawingSource();
  }

  getDrawingCollection(): FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: this.drawings.map((feature) => ({
        ...feature,
        geometry: feature.geometry ? { ...feature.geometry } : feature.geometry,
        properties: { ...(feature.properties ?? {}) }
      }))
    };
  }

  private ensureDrawingLayers(): void {
    if (!this.map || this.map.getSource(this.drawingSourceId)) {
      return;
    }

    this.map.addSource(this.drawingSourceId, {
      type: 'geojson',
      data: this.toCollection(this.drawings)
    });

    this.map.addLayer({
      id: `${this.drawingSourceId}-line`,
      type: 'line',
      source: this.drawingSourceId,
      paint: {
        'line-color': '#ffdf7e',
        'line-width': 3,
        'line-dasharray': [1.4, 1]
      }
    });

    this.map.addLayer({
      id: `${this.drawingSourceId}-fill`,
      type: 'fill',
      source: this.drawingSourceId,
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
      paint: {
        'fill-color': '#ffdf7e',
        'fill-opacity': 0.16
      }
    });

    this.map.addLayer({
      id: `${this.drawingSourceId}-point`,
      type: 'circle',
      source: this.drawingSourceId,
      paint: {
        'circle-color': '#ffffff',
        'circle-radius': 4,
        'circle-stroke-color': '#ffdf7e',
        'circle-stroke-width': 2
      }
    });
  }

  private ensurePreviewLayers(): void {
    if (!this.map || this.map.getSource(this.previewSourceId)) {
      return;
    }

    this.map.addSource(this.previewSourceId, {
      type: 'geojson',
      data: this.toCollection([])
    });

    this.map.addLayer({
      id: `${this.previewSourceId}-fill`,
      type: 'fill',
      source: this.previewSourceId,
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
      paint: {
        'fill-color': '#78a7ff',
        'fill-opacity': 0.22
      }
    });

    this.map.addLayer({
      id: `${this.previewSourceId}-line`,
      type: 'line',
      source: this.previewSourceId,
      paint: {
        'line-color': '#9bbcff',
        'line-width': 2
      }
    });

    this.map.addLayer({
      id: `${this.previewSourceId}-point`,
      type: 'circle',
      source: this.previewSourceId,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': '#ffffff',
        'circle-radius': 5,
        'circle-stroke-color': '#78a7ff',
        'circle-stroke-width': 2
      }
    });
  }

  private updateDrawingSource(): void {
    if (!this.mapReady() || !this.map) {
      return;
    }

    this.ensureDrawingLayers();
    const source = this.map.getSource(this.drawingSourceId) as GeoJSONSource | undefined;
    source?.setData(this.toCollection(this.drawings));
  }

  private toCollection(features: Feature[]): FeatureCollection {
    return {
      type: 'FeatureCollection',
      features
    };
  }

  private computeBounds(collection: FeatureCollection): LngLatBoundsLike | null {
    const coordinates: [number, number][] = [];
    for (const feature of collection.features) {
      this.collectCoordinates(feature.geometry, coordinates);
    }

    if (coordinates.length === 0) {
      return null;
    }

    const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
    for (const coordinate of coordinates.slice(1)) {
      bounds.extend(coordinate);
    }
    return bounds;
  }

  private boundsFromCoordinates(coordinates: [[number, number], [number, number], [number, number], [number, number]]): LngLatBoundsLike {
    const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
    for (const coordinate of coordinates.slice(1)) {
      bounds.extend(coordinate);
    }
    return bounds;
  }

  private cogMetadata(layer: MapLayer): CogMetadata | null {
    const metadata = layer.metadata;
    if (!metadata) {
      return null;
    }

    return {
      width: Number(metadata['width'] ?? 0),
      height: Number(metadata['height'] ?? 0),
      bandCount: Number(metadata['bandCount'] ?? 0),
      fileSize: Number(metadata['fileSize'] ?? 0),
      bbox: (metadata['bbox'] ?? null) as CogMetadata['bbox'],
      mapCoordinates: (metadata['mapCoordinates'] ?? null) as CogMetadata['mapCoordinates'],
      imageUrl: typeof metadata['imageUrl'] === 'string' ? metadata['imageUrl'] : null,
      projection: typeof metadata['projection'] === 'string' ? metadata['projection'] : null,
      warning: typeof metadata['warning'] === 'string' ? metadata['warning'] : null
    };
  }

  private collectCoordinates(geometry: Geometry | null, output: [number, number][]): void {
    if (!geometry) {
      return;
    }

    if (geometry.type === 'GeometryCollection') {
      for (const child of geometry.geometries) {
        this.collectCoordinates(child, output);
      }
      return;
    }

    this.visitPositionTree(geometry.coordinates, output);
  }

  private visitPositionTree(value: Position | Position[] | Position[][] | Position[][][], output: [number, number][]): void {
    if (Array.isArray(value) && value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      output.push([value[0], value[1]]);
      return;
    }

    for (const item of value as Position[] | Position[][] | Position[][][]) {
      this.visitPositionTree(item, output);
    }
  }
}
