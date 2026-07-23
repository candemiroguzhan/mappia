export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Uint8Array) {
    const sample = Array.from(value.slice(0, 12))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join(' ');
    return `WKB/Binary ${value.byteLength} bytes ${sample}`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function quoteIdent(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}
