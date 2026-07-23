import { computed, Injectable, signal } from '@angular/core';
import { MapLayer } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class LayerStore {
  private readonly layersState = signal<MapLayer[]>([]);

  readonly layers = this.layersState.asReadonly();
  readonly visibleLayers = computed(() => this.layersState().filter((layer) => layer.visible));

  addLayer(layer: MapLayer): void {
    this.layersState.update((layers) => [layer, ...layers.filter((current) => current.id !== layer.id)]);
  }

  removeLayer(layerId: string): void {
    this.layersState.update((layers) => layers.filter((layer) => layer.id !== layerId));
  }

  toggleVisibility(layerId: string): MapLayer | null {
    let updated: MapLayer | null = null;
    this.layersState.update((layers) =>
      layers.map((layer) => {
        if (layer.id !== layerId) {
          return layer;
        }
        updated = { ...layer, visible: !layer.visible };
        return updated;
      })
    );
    return updated;
  }

  setOpacity(layerId: string, opacity: number): MapLayer | null {
    const normalized = Math.min(1, Math.max(0, opacity));
    let updated: MapLayer | null = null;
    this.layersState.update((layers) =>
      layers.map((layer) => {
        if (layer.id !== layerId) {
          return layer;
        }
        updated = { ...layer, opacity: normalized };
        return updated;
      })
    );
    return updated;
  }

  setColor(layerId: string, color: string): MapLayer | null {
    let updated: MapLayer | null = null;
    this.layersState.update((layers) =>
      layers.map((layer) => {
        if (layer.id !== layerId) {
          return layer;
        }
        updated = { ...layer, color };
        return updated;
      })
    );
    return updated;
  }

  setIcon(layerId: string, icon: string): MapLayer | null {
    let updated: MapLayer | null = null;
    this.layersState.update((layers) =>
      layers.map((layer) => {
        if (layer.id !== layerId) {
          return layer;
        }
        updated = { ...layer, icon };
        return updated;
      })
    );
    return updated;
  }

  renameLayer(layerId: string, name: string): MapLayer | null {
    const trimmed = name.trim();
    if (!trimmed) {
      return null;
    }

    let updated: MapLayer | null = null;
    this.layersState.update((layers) =>
      layers.map((layer) => {
        if (layer.id !== layerId) {
          return layer;
        }
        updated = { ...layer, name: trimmed };
        return updated;
      })
    );
    return updated;
  }

  getLayers(): MapLayer[] {
    return this.layersState();
  }

  getVisibleLayers(): MapLayer[] {
    return this.visibleLayers();
  }

  clearLayers(): void {
    this.layersState.set([]);
  }
}
