import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, input } from '@angular/core';
import type { Feature, FeatureCollection } from 'geojson';
import maplibregl, { Map, MapMouseEvent } from 'maplibre-gl';
import { LayerMapService } from '../../core/services/layer-map.service';
import { MapStatusService } from '../../core/services/map-status.service';
import { MapFeatureService } from '../../core/services/map-feature.service';
import { ToolService } from '../../core/services/tool.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  templateUrl: './map-view.html',
  styleUrl: './map-view.scss'
})
export class MapViewComponent implements AfterViewInit, OnDestroy {
  private readonly mapFeatureService = inject(MapFeatureService);
  private readonly layerMap = inject(LayerMapService);
  private readonly mapStatus = inject(MapStatusService);
  private readonly toolService = inject(ToolService);
  private map: Map | null = null;
  private loaded = false;
  private activePositions: [number, number][] = [];

  readonly rows = input.required<Record<string, unknown>[]>();
  protected readonly mapError = this.mapStatus.mapError;
  protected readonly measurement = this.toolService.lastMeasurement;
  protected readonly drawingMode = computed(() => this.isDrawingMode(this.toolService.activeTool()));

  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer!: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const rows = this.rows();
      queueMicrotask(() => this.updateFeatures(rows));
    });
    effect(() => {
      this.toolService.activeTool();
      this.activePositions = [];
      this.updateMapCursor();
    });
  }

  ngAfterViewInit(): void {
    try {
      this.map = new maplibregl.Map({
        container: this.mapContainer.nativeElement,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [29, 39],
        zoom: 4,
        attributionControl: false
      });

      this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      this.map.on('mousemove', (event) => {
        this.mapStatus.setCoordinate(event.lngLat.lng, event.lngLat.lat);
        this.updateMapCursor();
      });
      this.map.on('zoom', () => {
        if (this.map) {
          this.mapStatus.setZoom(this.map.getZoom());
        }
      });
      this.map.on('click', (event) => this.handleMapClick(event));
      this.map.on('error', (event) => {
        console.error('MapLibre error', event.error);
        this.mapStatus.setError(event.error?.message ?? 'Map rendering error.');
      });

      this.map.once('load', () => {
        this.loaded = true;
        this.mapStatus.setError(null);
        if (this.map) {
          this.layerMap.registerMap(this.map);
          this.mapStatus.setZoom(this.map.getZoom());
          this.updateMapCursor();
        }
        this.updateFeatures(this.rows());
      });
    } catch (error) {
      console.error('Map initialization failed', error);
      this.mapStatus.setError(error instanceof Error ? error.message : 'Map initialization failed.');
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private updateFeatures(rows: Record<string, unknown>[]): void {
    if (!this.map || !this.loaded) {
      return;
    }

    const features = this.mapFeatureService.toFeatures(rows);
    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features: features.map((feature) => ({
        type: 'Feature',
        id: feature.id,
        geometry: feature.geometry,
        properties: feature.properties
      }))
    };

    this.layerMap.setQueryPreview(collection);
  }

  private updateMapCursor(): void {
    if (!this.map) {
      return;
    }

    const tool = this.toolService.activeTool();
    const drawingMode = this.isDrawingMode(tool);
    const cursor = drawingMode ? this.pencilCursor() : '';
    if (drawingMode) {
      this.map.dragPan.disable();
    } else {
      this.map.dragPan.enable();
    }
    this.map.getCanvas().style.cursor = cursor;
    this.map.getCanvasContainer().style.cursor = cursor;
  }

  private isDrawingMode(tool: string): boolean {
    return tool !== 'pan' && tool !== 'select';
  }

  private pencilCursor(): string {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">',
      '<path fill="black" d="M4 17.2V21h3.8L19.1 9.7l-3.8-3.8L4 17.2z"/>',
      '<path fill="white" d="M5.6 17.9l9.7-9.7.6.6-9.7 9.7H5.6v-.6z"/>',
      '<path fill="black" d="M20.3 8.5l-3.8-3.8 1.4-1.4a1.2 1.2 0 0 1 1.7 0l2.1 2.1a1.2 1.2 0 0 1 0 1.7l-1.4 1.4z"/>',
      '</svg>'
    ].join('');
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 4 20, crosshair`;
  }

  private handleMapClick(event: MapMouseEvent): void {
    const tool = this.toolService.activeTool();
    if (tool === 'pan' || tool === 'select') {
      return;
    }

    const position: [number, number] = [event.lngLat.lng, event.lngLat.lat];

    if (tool === 'draw-point') {
      this.layerMap.addDrawingFeature({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: position },
        properties: {}
      });
      this.toolService.setMeasurement(`Point ${position[0].toFixed(5)}, ${position[1].toFixed(5)}`);
      return;
    }

    this.activePositions = [...this.activePositions, position];

    if (tool === 'measure-distance' || tool === 'draw-line') {
      this.layerMap.replaceDrawings(this.lineFeatures(this.activePositions));
      const distance = this.calculateDistance(this.activePositions);
      if (this.activePositions.length === 1) {
        this.toolService.setMeasurement(tool === 'draw-line' ? '1 line point' : '1 distance point');
      } else {
        this.toolService.setMeasurement(`${distance.toFixed(distance >= 1000 ? 2 : 0)} ${distance >= 1000 ? 'km' : 'm'}`);
      }
      return;
    }

    if (tool === 'measure-angle') {
      const positions = this.activePositions.slice(0, 3);
      this.activePositions = positions;
      this.layerMap.replaceDrawings(this.lineFeatures(positions));
      if (positions.length === 3) {
        this.toolService.setMeasurement(`${this.calculateAngle(positions).toFixed(1)} deg`);
      } else {
        this.toolService.setMeasurement(`${positions.length} angle point${positions.length === 1 ? '' : 's'}`);
      }
      return;
    }

    if (tool === 'measure-area' || tool === 'draw-polygon') {
      const features: Feature[] = this.lineFeatures(this.activePositions);
      if (this.activePositions.length >= 3) {
        features.push(this.polygonFeature(this.activePositions));
        const area = this.calculateArea(this.activePositions);
        this.toolService.setMeasurement(`${area >= 1_000_000 ? (area / 1_000_000).toFixed(2) + ' km2' : area.toFixed(0) + ' m2'}`);
      } else {
        this.toolService.setMeasurement(`${this.activePositions.length} polygon point${this.activePositions.length === 1 ? '' : 's'}`);
      }
      this.layerMap.replaceDrawings(features);
    }
  }

  private lineFeatures(positions: [number, number][]): Feature[] {
    if (positions.length === 0) {
      return [];
    }

    if (positions.length === 1) {
      return [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: positions[0]
          },
          properties: {}
        }
      ];
    }

    return [this.lineFeature(positions)];
  }

  private lineFeature(positions: [number, number][]): Feature {
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: positions
      },
      properties: {}
    };
  }

  private polygonFeature(positions: [number, number][]): Feature {
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[...positions, positions[0]]]
      },
      properties: {}
    };
  }

  private calculateDistance(positions: [number, number][]): number {
    return positions.slice(1).reduce((total, position, index) => total + this.segmentDistance(positions[index], position), 0);
  }

  private segmentDistance(start: [number, number], end: [number, number]): number {
    const radius = 6_371_000;
    const lat1 = this.toRadians(start[1]);
    const lat2 = this.toRadians(end[1]);
    const deltaLat = this.toRadians(end[1] - start[1]);
    const deltaLng = this.toRadians(end[0] - start[0]);
    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private calculateArea(positions: [number, number][]): number {
    const ring = [...positions, positions[0]];
    const earthRadius = 6_371_000;
    const area = ring.slice(1).reduce((sum, position, index) => {
      const previous = ring[index];
      return sum + this.toRadians(position[0] - previous[0]) * (2 + Math.sin(this.toRadians(previous[1])) + Math.sin(this.toRadians(position[1])));
    }, 0);
    return Math.abs((area * earthRadius * earthRadius) / 2);
  }

  private calculateAngle(positions: [number, number][]): number {
    const [start, vertex, end] = positions;
    const vectorA = [start[0] - vertex[0], start[1] - vertex[1]];
    const vectorB = [end[0] - vertex[0], end[1] - vertex[1]];
    const dot = vectorA[0] * vectorB[0] + vectorA[1] * vectorB[1];
    const lengthA = Math.hypot(vectorA[0], vectorA[1]);
    const lengthB = Math.hypot(vectorB[0], vectorB[1]);
    const cosine = dot / (lengthA * lengthB);
    return (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI;
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
