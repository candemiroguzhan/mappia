import { Injectable, computed, signal } from '@angular/core';
import * as duckdb from '@duckdb/duckdb-wasm';
import { ColumnSchema, DashboardStats, NumericSummary, QueryError, QueryResult, SchemaContext, UploadedTable } from '../../shared/models';
import { quoteIdent } from '../../shared/formatters';

type AsyncDuckDB = duckdb.AsyncDuckDB;
type AsyncDuckDBConnection = duckdb.AsyncDuckDBConnection;
type DuckDbArrowTable = Awaited<ReturnType<AsyncDuckDBConnection['query']>>;

@Injectable({ providedIn: 'root' })
export class DuckDbService {
  private db: AsyncDuckDB | null = null;
  private connection: AsyncDuckDBConnection | null = null;
  private initPromise: Promise<void> | null = null;

  readonly initializing = signal(false);
  readonly busy = signal(false);
  readonly tables = signal<UploadedTable[]>([]);
  readonly lastResult = signal<QueryResult | null>(null);
  readonly lastError = signal<QueryError | null>(null);
  readonly spatialAvailable = signal<boolean | null>(null);

  readonly dashboard = computed<DashboardStats>(() => {
    const tables = this.tables();
    const lastResult = this.lastResult();
    return {
      totalRows: tables.reduce<number | null>((sum, table) => {
        if (sum === null || table.rowCount === null) {
          return null;
        }
        return sum + table.rowCount;
      }, 0),
      columnCount: tables.reduce((sum, table) => sum + table.columns.length, 0),
      lastQueryMs: lastResult?.elapsedMs ?? null,
      uploadedBytes: tables.reduce((sum, table) => sum + table.sizeBytes, 0),
      numericSummaries: this.computeNumericSummaries(lastResult)
    };
  });

  readonly schemaContext = computed<SchemaContext>(() => ({
    tables: this.tables().map((table) => ({
      name: table.tableName,
      columns: table.columns
    }))
  }));

  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.createDatabase();
    return this.initPromise;
  }

  async registerFile(file: File): Promise<UploadedTable> {
    await this.initialize();
    const connection = this.requireConnection();
    this.busy.set(true);
    this.lastError.set(null);

    try {
      const tableName = this.createTableName(file.name);
      const duckDbFileName = `${crypto.randomUUID()}-${file.name}`;
      const buffer = new Uint8Array(await file.arrayBuffer());
      await this.db?.registerFileBuffer(duckDbFileName, buffer);

      const lower = file.name.toLowerCase();
      const sourceSql = lower.endsWith('.csv')
        ? `read_csv_auto('${duckDbFileName}', HEADER=TRUE, SAMPLE_SIZE=-1, IGNORE_ERRORS=TRUE)`
        : `read_parquet('${duckDbFileName}')`;

      await connection.query(`CREATE OR REPLACE VIEW ${quoteIdent(tableName)} AS SELECT * FROM ${sourceSql}`);
      const columns = await this.describeTable(tableName);
      const rowCount = await this.countRows(tableName);
      const geoHints = await this.createGeoHints(tableName, columns);

      const uploaded: UploadedTable = {
        tableName,
        fileName: file.name,
        duckDbFileName,
        sizeBytes: file.size,
        rowCount,
        columns,
        registeredAt: new Date().toISOString(),
        geoHints
      };

      this.tables.update((tables) => [...tables.filter((table) => table.tableName !== tableName), uploaded]);
      return uploaded;
    } catch (error) {
      const queryError = this.normalizeError(error);
      this.lastError.set(queryError);
      throw new Error(queryError.message);
    } finally {
      this.busy.set(false);
    }
  }

  async query(sql: string): Promise<QueryResult> {
    await this.initialize();
    const connection = this.requireConnection();
    this.busy.set(true);
    this.lastError.set(null);
    const startedAt = performance.now();

    try {
      const table = await connection.query(sql);
      const elapsedMs = performance.now() - startedAt;
      const result = this.arrowToQueryResult(table, sql, elapsedMs);
      this.lastResult.set(result);
      this.storeHistory(sql);
      return result;
    } catch (error) {
      const queryError = this.normalizeError(error);
      const result: QueryResult = {
        columns: [],
        rows: [],
        totalRows: 0,
        elapsedMs: performance.now() - startedAt,
        truncated: false,
        error: queryError,
        sql
      };
      this.lastError.set(queryError);
      this.lastResult.set(result);
      return result;
    } finally {
      this.busy.set(false);
    }
  }

  getHistory(): string[] {
    try {
      return JSON.parse(localStorage.getItem('duckdb-query-history') ?? '[]') as string[];
    } catch {
      return [];
    }
  }

  private async createDatabase(): Promise<void> {
    this.initializing.set(true);

    try {
      const bundles = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(bundles);
      const workerUrl = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
      );
      const worker = new Worker(workerUrl);
      const logger = new duckdb.ConsoleLogger();
      this.db = new duckdb.AsyncDuckDB(logger, worker);
      await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      URL.revokeObjectURL(workerUrl);
      this.connection = await this.db.connect();
      await this.detectSpatialSupport();
    } finally {
      this.initializing.set(false);
    }
  }

  private requireConnection(): AsyncDuckDBConnection {
    if (!this.connection) {
      throw new Error('DuckDB WASM connection is not initialized.');
    }
    return this.connection;
  }

  private async describeTable(tableName: string): Promise<ColumnSchema[]> {
    const table = await this.requireConnection().query(`DESCRIBE SELECT * FROM ${quoteIdent(tableName)}`);
    return this.arrowRows(table).map((row) => ({
      name: String(row['column_name'] ?? row['Column Name'] ?? ''),
      type: String(row['column_type'] ?? row['Column Type'] ?? 'UNKNOWN')
    }));
  }

  private async countRows(tableName: string): Promise<number | null> {
    try {
      const table = await this.requireConnection().query(`SELECT COUNT(*) AS row_count FROM ${quoteIdent(tableName)}`);
      const row = this.arrowRows(table)[0];
      const value = row?.['row_count'];
      return typeof value === 'bigint' ? Number(value) : Number(value ?? 0);
    } catch {
      return null;
    }
  }

  private async detectSpatialSupport(): Promise<void> {
    try {
      await this.requireConnection().query(`INSTALL spatial; LOAD spatial;`);
      this.spatialAvailable.set(true);
    } catch {
      this.spatialAvailable.set(false);
    }
  }

  private async createGeoHints(tableName: string, columns: ColumnSchema[]): Promise<string[]> {
    const geometryColumn = columns.find((column) => /^(geometry|geom|wkb)$/i.test(column.name));
    if (!geometryColumn) {
      return [];
    }

    const table = quoteIdent(tableName);
    const column = quoteIdent(geometryColumn.name);
    return this.spatialAvailable()
      ? [
          `SELECT *, ST_AsText(ST_GeomFromWKB(${column})) AS wkt FROM ${table} LIMIT 100;`,
          `SELECT ST_AsGeoJSON(ST_GeomFromWKB(${column})) AS geojson FROM ${table} LIMIT 100;`
        ]
      : [
          'Spatial extension could not be loaded in this WASM session. Return WKT or GeoJSON from the source query when possible.',
          `SELECT ${column} AS geometry_wkb FROM ${table} LIMIT 100;`
        ];
  }

  private arrowToQueryResult(table: DuckDbArrowTable, sql: string, elapsedMs: number): QueryResult {
    const columns = table.schema.fields.map((field) => ({
      name: field.name,
      type: field.type.toString()
    }));
    const rows = this.arrowRows(table);
    return {
      columns,
      rows: rows.slice(0, 1000),
      totalRows: rows.length,
      elapsedMs,
      truncated: rows.length > 1000,
      sql
    };
  }

  private arrowRows(table: DuckDbArrowTable): Record<string, unknown>[] {
    return table.toArray().map((row) => this.normalizeRow(row as Record<string, unknown>));
  }

  private normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (typeof value === 'bigint') {
          return [key, Number.isSafeInteger(Number(value)) ? Number(value) : value.toString()];
        }

        if (value instanceof Date || value instanceof Uint8Array || value === null) {
          return [key, value];
        }

        if (ArrayBuffer.isView(value)) {
          return [key, new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength))];
        }

        return [key, value];
      })
    );
  }

  private createTableName(fileName: string): string {
    const base = fileName.replace(/\.(geo)?parquet$/i, '').replace(/\.csv$/i, '');
    const normalized = base.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, 't_$1').toLowerCase();
    return normalized || `table_${Date.now()}`;
  }

  private normalizeError(error: unknown): QueryError {
    const message = error instanceof Error ? error.message : String(error);
    return {
      message: message.replace(/^Error:\s*/i, ''),
      detail: error instanceof Error ? error.stack : undefined
    };
  }

  private storeHistory(sql: string): void {
    const trimmed = sql.trim();
    if (!trimmed) {
      return;
    }

    const history = [trimmed, ...this.getHistory().filter((entry) => entry !== trimmed)].slice(0, 20);
    localStorage.setItem('duckdb-query-history', JSON.stringify(history));
  }

  private computeNumericSummaries(result: QueryResult | null): NumericSummary[] {
    if (!result || result.rows.length === 0) {
      return [];
    }

    return result.columns
      .filter((column) => /int|float|double|decimal|number|hugeint|real/i.test(column.type))
      .slice(0, 4)
      .map((column) => {
        const values = result.rows.map((row) => Number(row[column.name])).filter(Number.isFinite);
        const sum = values.reduce((total, value) => total + value, 0);
        return {
          column: column.name,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.length ? sum / values.length : 0
        };
      })
      .filter((summary) => Number.isFinite(summary.min));
  }
}
