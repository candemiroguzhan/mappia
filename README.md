# mappia / DuckSpatial Workbench

Modern browser-native geospatial workbench built with Angular standalone components, Signals, MapLibre GL JS, DuckDB WASM, Monaco Editor and geotiff.js.

## Supported Formats

- CSV: registered in DuckDB WASM and listed as a table-backed layer.
- Parquet: registered in DuckDB WASM and listed as a table-backed layer.
- GeoParquet: registered in DuckDB WASM. Geometry visualization depends on query output exposing WKT, GeoJSON or coordinate columns.
- GeoJSON / JSON: added directly to MapLibre as a vector layer.
- TIFF / GeoTIFF / COG: metadata is read with geotiff.js and registered as a COG layer.
- Remote COG URL: metadata read is available when the remote server supports browser CORS/range access.

## COG Limitations

The current COG phase reads metadata only: width, height, band count, bounding box, projection and file size for local files. Local COG files are not yet served as map tiles, so they are not rendered as MapLibre raster tile sources in this phase.

If the COG projection is not EPSG:4326 or EPSG:3857, the UI warns that reprojection is required for correct map placement.

## GeoParquet Notes

GeoParquet files are registered through DuckDB WASM. If the DuckDB spatial extension loads, generated snippets can convert WKB geometry into WKT or GeoJSON. Query results with columns named `geometry`, `geom`, `wkt`, `geojson` or `coordinates` are previewed on the map.

## SQL Examples

```sql
SELECT * FROM "table_name" LIMIT 100;
```

```sql
SELECT COUNT(*) AS row_count FROM "table_name";
```

```sql
SELECT *, ST_AsGeoJSON(ST_GeomFromWKB(geometry)) AS geojson
FROM "table_name"
LIMIT 1000;
```

## Natural Language Query

Natural language query currently uses a local rule-based provider. It can generate simple SQL for prompts such as:

- `ilk 100 kaydı göster`
- `count al`
- `alan ortalamasını hesapla`
- `1000 metrekareden büyük kayıtları getir`
- `yüksekliği 10'dan büyük binaları getir`

The adapter interface is ready for OpenAI or Ollama-backed providers, but those providers are placeholders until configured.

## Layer Manager

Every uploaded dataset is registered as a layer. GeoJSON layers are synchronized with MapLibre and support:

- visibility toggle
- opacity slider
- rename
- remove from map and layer list
- zoom to layer

CSV, Parquet, GeoParquet and COG layers are listed with metadata. COG map rendering is a later phase.

## Map Tools

The tools panel supports:

- Pan / Select
- Measure Distance
- Measure Area
- Draw Point
- Draw Line
- Draw Polygon
- Clear Drawings
- SQL Query Tool
- Fit All Layers
- Reset View

Measurement output is displayed as a floating glass tooltip over the map.

## Build

```bash
npm install
npm run build
```
