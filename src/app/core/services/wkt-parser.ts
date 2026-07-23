import type { Geometry } from 'geojson';

type Position = [number, number];

function stripOuterParens(value: string): string {
  let text = value.trim();
  if (text.startsWith('(') && text.endsWith(')')) {
    text = text.slice(1, -1);
  }
  return text.trim();
}

function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function parsePosition(value: string): Position {
  const [x, y] = value
    .trim()
    .split(/\s+/)
    .map(Number);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`Invalid WKT coordinate: ${value}`);
  }

  return [x, y];
}

function parseLine(value: string): Position[] {
  return splitTopLevel(stripOuterParens(value)).map(parsePosition);
}

function parsePolygon(value: string): Position[][] {
  return splitTopLevel(stripOuterParens(value)).map((ring) => parseLine(ring));
}

export function parseWkt(input: string): Geometry | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^([a-zA-Z]+)\s*(.*)$/);
  if (!match) {
    return null;
  }

  const type = match[1].toUpperCase();
  const body = match[2].trim();
  if (body.toUpperCase() === 'EMPTY') {
    return null;
  }

  switch (type) {
    case 'POINT':
      return { type: 'Point', coordinates: parsePosition(stripOuterParens(body)) };
    case 'LINESTRING':
      return { type: 'LineString', coordinates: parseLine(body) };
    case 'POLYGON':
      return { type: 'Polygon', coordinates: parsePolygon(body) };
    case 'MULTIPOLYGON':
      return {
        type: 'MultiPolygon',
        coordinates: splitTopLevel(stripOuterParens(body)).map((polygon) => parsePolygon(polygon))
      };
    default:
      return null;
  }
}
