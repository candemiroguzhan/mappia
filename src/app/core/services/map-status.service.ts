import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MapStatusService {
  readonly longitude = signal<number | null>(null);
  readonly latitude = signal<number | null>(null);
  readonly zoom = signal<number | null>(null);
  readonly mapError = signal<string | null>(null);

  setCoordinate(lng: number, lat: number): void {
    this.longitude.set(lng);
    this.latitude.set(lat);
  }

  setZoom(zoom: number): void {
    this.zoom.set(zoom);
  }

  setError(error: string | null): void {
    this.mapError.set(error);
  }
}
