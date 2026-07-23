import { Injectable } from '@angular/core';
import { fromArrayBuffer, fromUrl } from 'geotiff';
import proj4 from 'proj4';
import { CogMetadata } from '../../shared/models';

const REPROJECTION_WARNING =
  'This COG uses a projected CRS. It is reprojected from its bounding box for map placement; full raster reprojection is not applied.';

const UNSUPPORTED_PROJECTION_WARNING =
  'This COG uses a CRS that could not be converted to map coordinates. Metadata is available, but it cannot be placed on the map.';

const PREVIEW_MAX_SIZE = 1024;

type MapCoordinates = [[number, number], [number, number], [number, number], [number, number]];
type TypedRaster = Uint8Array | Uint8ClampedArray | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array;

interface CogImage {
  getBoundingBox(): number[];
  getGeoKeys(): Partial<Record<string, unknown>> | null;
  getWidth(): number;
  getHeight(): number;
  getSamplesPerPixel(): number;
  readRasters(options: { width: number; height: number; interleave: true }): Promise<TypedRaster & { width?: number; height?: number }>;
}

@Injectable({ providedIn: 'root' })
export class CogService {
  async loadCogFile(file: File): Promise<CogMetadata> {
    try {
      const tiff = await fromArrayBuffer(await file.arrayBuffer());
      const image = await tiff.getImage();
      return this.metadataFromImage(image, file.size);
    } catch (error) {
      console.error('COG metadata read failed', error);
      throw new Error(error instanceof Error ? error.message : 'COG metadata could not be read.');
    }
  }

  async loadCogUrl(url: string): Promise<CogMetadata> {
    try {
      const tiff = await fromUrl(url);
      const image = await tiff.getImage();
      return this.metadataFromImage(image, 0);
    } catch (error) {
      console.error('Remote COG metadata read failed', error);
      throw new Error(error instanceof Error ? error.message : 'Remote COG metadata could not be read.');
    }
  }

  readMetadata(metadata: CogMetadata): CogMetadata {
    return metadata;
  }

  getBounds(metadata: CogMetadata): [number, number, number, number] | null {
    return metadata.bbox;
  }

  private normalizeBoundingBox(value: number[]): [number, number, number, number] | null {
    if (value.length < 4 || value.some((entry) => !Number.isFinite(entry))) {
      return null;
    }
    return [value[0], value[1], value[2], value[3]];
  }

  private async metadataFromImage(image: CogImage, fileSize: number): Promise<CogMetadata> {
    const bbox = this.normalizeBoundingBox(image.getBoundingBox());
    const projection = this.projectionFromGeoKeys(image.getGeoKeys());
    const mapCoordinates = bbox ? this.mapCoordinatesFromBoundingBox(bbox, projection) : null;
    const projectionWarning = this.needsProjectionWarning(projection) ? REPROJECTION_WARNING : null;
    const warning = bbox && !mapCoordinates ? UNSUPPORTED_PROJECTION_WARNING : projectionWarning;

    return {
      width: image.getWidth(),
      height: image.getHeight(),
      bandCount: image.getSamplesPerPixel(),
      fileSize,
      bbox,
      mapCoordinates,
      imageUrl: await this.renderPreviewFromImage(image),
      projection,
      warning
    };
  }

  private projectionFromGeoKeys(geoKeys: Partial<Record<string, unknown>> | null): string | null {
    if (!geoKeys) {
      return null;
    }

    const projected = geoKeys['ProjectedCSTypeGeoKey'];
    const geographic = geoKeys['GeographicTypeGeoKey'];
    if (typeof projected === 'number') {
      return `EPSG:${projected}`;
    }
    if (typeof geographic === 'number') {
      return `EPSG:${geographic}`;
    }
    return null;
  }

  private needsProjectionWarning(projection: string | null): boolean {
    return projection !== null && projection !== 'EPSG:4326' && projection !== 'EPSG:3857';
  }

  private mapCoordinatesFromBoundingBox(bbox: [number, number, number, number], projection: string | null): MapCoordinates | null {
    const [minX, minY, maxX, maxY] = bbox;
    const corners: MapCoordinates = [
      [minX, maxY],
      [maxX, maxY],
      [maxX, minY],
      [minX, minY]
    ];

    if (!projection || projection === 'EPSG:4326') {
      return this.validLngLatCoordinates(corners) ? corners : null;
    }

    if (projection === 'EPSG:3857') {
      return this.transformCoordinates(corners, 'EPSG:3857');
    }

    const definition = this.proj4Definition(projection);
    return definition ? this.transformCoordinates(corners, definition) : null;
  }

  private transformCoordinates(coordinates: MapCoordinates, sourceProjection: string): MapCoordinates | null {
    try {
      const transformed = coordinates.map((coordinate) => proj4(sourceProjection, 'EPSG:4326', coordinate)) as MapCoordinates;
      return this.validLngLatCoordinates(transformed) ? transformed : null;
    } catch (error) {
      console.warn('COG projection transform failed', error);
      return null;
    }
  }

  private proj4Definition(projection: string): string | null {
    const match = projection.match(/^EPSG:(\d+)$/);
    const epsg = match ? Number(match[1]) : NaN;
    if (!Number.isInteger(epsg)) {
      return null;
    }

    if (epsg >= 32601 && epsg <= 32660) {
      return `+proj=utm +zone=${epsg - 32600} +datum=WGS84 +units=m +no_defs`;
    }

    if (epsg >= 32701 && epsg <= 32760) {
      return `+proj=utm +zone=${epsg - 32700} +south +datum=WGS84 +units=m +no_defs`;
    }

    return null;
  }

  private validLngLatCoordinates(coordinates: MapCoordinates): boolean {
    return coordinates.every(([longitude, latitude]) =>
      Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
    );
  }

  private async renderPreviewFromImage(image: CogImage): Promise<string | null> {
    const width = image.getWidth();
    const height = image.getHeight();
    const scale = Math.min(1, PREVIEW_MAX_SIZE / Math.max(width, height));
    const previewWidth = Math.max(1, Math.round(width * scale));
    const previewHeight = Math.max(1, Math.round(height * scale));

    const raster = await image.readRasters({
      width: previewWidth,
      height: previewHeight,
      interleave: true
    });

    const samples = Math.max(1, image.getSamplesPerPixel());
    const ranges = this.sampleRanges(raster, samples);
    const canvas = document.createElement('canvas');
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    const imageData = context.createImageData(previewWidth, previewHeight);
    for (let pixel = 0; pixel < previewWidth * previewHeight; pixel += 1) {
      const sourceIndex = pixel * samples;
      const targetIndex = pixel * 4;
      if (samples === 1) {
        const value = this.normalizeSample(raster[sourceIndex], ranges[0]);
        imageData.data[targetIndex] = value;
        imageData.data[targetIndex + 1] = value;
        imageData.data[targetIndex + 2] = value;
        imageData.data[targetIndex + 3] = 255;
      } else {
        imageData.data[targetIndex] = this.normalizeSample(raster[sourceIndex], ranges[0]);
        imageData.data[targetIndex + 1] = this.normalizeSample(raster[sourceIndex + 1], ranges[1] ?? ranges[0]);
        imageData.data[targetIndex + 2] = this.normalizeSample(raster[sourceIndex + 2], ranges[2] ?? ranges[0]);
        imageData.data[targetIndex + 3] = samples >= 4 ? this.normalizeSample(raster[sourceIndex + 3], ranges[3] ?? ranges[0]) : 255;
      }
    }

    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  private sampleRanges(raster: TypedRaster, samples: number): { min: number; max: number }[] {
    const ranges = Array.from({ length: samples }, () => ({ min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }));

    for (let index = 0; index < raster.length; index += 1) {
      const value = raster[index];
      if (!Number.isFinite(value)) {
        continue;
      }

      const range = ranges[index % samples];
      range.min = Math.min(range.min, value);
      range.max = Math.max(range.max, value);
    }

    return ranges.map((range) => {
      if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min === range.max) {
        return { min: 0, max: 255 };
      }
      return range;
    });
  }

  private normalizeSample(value: number, range: { min: number; max: number }): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.round(Math.min(255, Math.max(0, ((value - range.min) / (range.max - range.min)) * 255)));
  }
}
