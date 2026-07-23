# Mappia 🌐

![Stars](https://img.shields.io/github/stars/candemiroguzhan/mappia?style=flat-square)
![Forks](https://img.shields.io/github/forks/candemiroguzhan/mappia?style=flat-square)
![Issues](https://img.shields.io/github/issues/candemiroguzhan/mappia?style=flat-square)
![Contributors](https://img.shields.io/github/contributors/candemiroguzhan/mappia?style=flat-square)
![License](https://img.shields.io/github/license/candemiroguzhan/mappia?style=flat-square)
![Angular](https://img.shields.io/badge/Angular-Standalone-DD0031?style=flat-square\&logo=angular)
![DuckDB](https://img.shields.io/badge/DuckDB-WASM-FFF000?style=flat-square\&logo=duckdb)
![MapLibre](https://img.shields.io/badge/MapLibre-GL_JS-396CB2?style=flat-square)

A modern browser-native geospatial workbench for loading, querying, inspecting and visualizing spatial datasets directly in the browser.

Built with Angular standalone components, Signals, DuckDB WASM, DuckDB Spatial, MapLibre GL JS, Monaco Editor and geotiff.js, Mappia provides a lightweight GIS environment without requiring a dedicated backend service.


## ✨ Features

* 📂 Load local geospatial and tabular datasets
* 🦆 Register CSV, Parquet and GeoParquet files in DuckDB WASM
* 🧮 Execute SQL queries directly in the browser
* 🗺️ Visualize GeoJSON and compatible query results with MapLibre GL JS
* 🛰️ Inspect TIFF, GeoTIFF and Cloud Optimized GeoTIFF metadata
* 🌐 Read remote COG metadata when CORS and HTTP range requests are supported
* 🧾 Write and execute SQL using the integrated Monaco Editor
* 💬 Generate basic SQL from Turkish natural-language prompts
* 📚 Manage datasets through a unified layer manager
* 📏 Measure distance and area
* ✏️ Draw points, lines and polygons
* 🔍 Zoom to individual layers or fit all layers
* 🔒 Process supported local datasets entirely in the browser

## 🧪 Technology

* **Angular** — Application framework
* **Angular Standalone Components** — Modular component architecture
* **Angular Signals** — Reactive state management
* **TypeScript** — Application code
* **DuckDB WASM** — Browser-native analytical database
* **DuckDB Spatial** — Spatial SQL functions and geometry processing
* **MapLibre GL JS** — Interactive map rendering
* **Monaco Editor** — Integrated SQL editor
* **geotiff.js** — TIFF, GeoTIFF and COG metadata parsing
* **WebAssembly** — Browser-native data processing
* **Web Workers** — Background processing
* **HTML5 File API** — Local dataset access

## 📦 Supported Formats

| Format         | Current Support                                         |
| -------------- | ------------------------------------------------------- |
| CSV            | Registered as a DuckDB table                            |
| Parquet        | Registered as a DuckDB table                            |
| GeoParquet     | Registered in DuckDB WASM with spatial-query support    |
| GeoJSON        | Rendered directly as a MapLibre vector layer            |
| JSON           | Loaded when compatible with GeoJSON structures          |
| TIFF           | Raster metadata inspection                              |
| GeoTIFF        | Spatial raster metadata inspection                      |
| COG            | Metadata inspection                                     |
| Remote COG URL | Metadata inspection with CORS and range-request support |

## 🗺️ Vector Data

GeoJSON datasets are added directly to MapLibre as vector sources.

Supported geometry types include:

* Point
* MultiPoint
* LineString
* MultiLineString
* Polygon
* MultiPolygon
* GeometryCollection

Vector layers support:

* Visibility control
* Opacity control
* Rename
* Remove
* Zoom to extent
* Basic geometry styling

CSV, Parquet and GeoParquet datasets are registered as DuckDB-backed layers.

Spatial query results can be previewed when they expose recognizable columns such as:

* `geometry`
* `geom`
* `wkt`
* `geojson`
* `coordinates`
* `longitude` and `latitude`
* `lon` and `lat`
* `x` and `y`

## 🛰️ Raster and COG Support

Mappia uses `geotiff.js` to inspect TIFF, GeoTIFF and Cloud Optimized GeoTIFF datasets.

Currently extracted metadata may include:

* Raster width
* Raster height
* Band count
* Bounding box
* Projection information
* GeoTIFF keys
* File size
* Local or remote source information

### Current COG Limitations

The current COG implementation focuses on metadata inspection.

Local COG files are not yet exposed as raster tile sources and therefore are not rendered directly as MapLibre raster layers.

Remote COG access requires the source server to support:

* Cross-Origin Resource Sharing
* HTTP byte-range requests
* Browser-accessible response headers

Correct map placement may require reprojection when the raster does not use:

* `EPSG:4326`
* `EPSG:3857`

The application displays a warning when reprojection is required.

## 🧮 SQL Workbench

The integrated Monaco Editor allows SQL queries to be executed against datasets registered in DuckDB WASM.

### Preview Records

```sql
SELECT *
FROM "table_name"
LIMIT 100;
```

### Count Records

```sql
SELECT COUNT(*) AS row_count
FROM "table_name";
```

### Filter Records

```sql
SELECT *
FROM "table_name"
WHERE area > 1000
LIMIT 1000;
```

### Calculate an Average

```sql
SELECT AVG(area) AS average_area
FROM "table_name";
```

### Convert WKB Geometry to GeoJSON

```sql
SELECT
    *,
    ST_AsGeoJSON(ST_GeomFromWKB(geometry)) AS geojson
FROM "table_name"
LIMIT 1000;
```

### Convert WKB Geometry to WKT

```sql
SELECT
    *,
    ST_AsText(ST_GeomFromWKB(geometry)) AS wkt
FROM "table_name"
LIMIT 1000;
```

## 💬 Natural-Language Query

Mappia includes an experimental natural-language query provider.

The current implementation uses local rule-based processing to convert supported Turkish prompts into basic SQL statements.

Example prompts:

```text
ilk 100 kaydı göster
```

```text
count al
```

```text
alan ortalamasını hesapla
```

```text
1000 metrekareden büyük kayıtları getir
```

```text
yüksekliği 10'dan büyük binaları getir
```

The provider abstraction is prepared for future integrations such as:

* OpenAI
* Ollama
* Schema-aware SQL generation
* Spatial SQL generation
* Query validation
* Query explanation

OpenAI and Ollama providers are currently placeholders until configured.

## 🧰 Map Tools

The map toolbar currently supports:

* Pan
* Select
* Measure Distance
* Measure Area
* Draw Point
* Draw Line
* Draw Polygon
* Clear Drawings
* SQL Query Tool
* Fit All Layers
* Reset View

Measurement results are displayed in a floating glass-style tooltip over the map.

## 📚 Layer Manager

Every imported dataset is registered as a workspace layer.

Depending on the dataset type, a layer may contain:

* DuckDB table information
* Source file metadata
* Geometry metadata
* Raster metadata
* MapLibre source references
* Visibility state
* Opacity state
* Spatial extent
* Display name

The layer manager supports:

* Toggle visibility
* Change opacity
* Rename layers
* Remove layers
* Zoom to layer extent
* Inspect available metadata

## 📁 Project Structure

```text
├─ public/
│  └─ assets/
├─ src/
│  ├─ app/
│  │  ├─ components/
│  │  ├─ core/
│  │  ├─ models/
│  │  ├─ services/
│  │  ├─ state/
│  │  ├─ tools/
│  │  ├─ app.component.ts
│  │  └─ app.config.ts
│  ├─ assets/
│  ├─ environments/
│  ├─ main.ts
│  └─ styles.css
├─ angular.json
├─ package.json
├─ tsconfig.json
└─ README.md
```

> The actual directory structure may change as the project evolves.

## 📋 Requirements

* Node.js 20 or later
* npm
* A modern browser with WebAssembly support
* Web Worker support
* WebGL support
* Internet access for external basemap resources

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/candemiroguzhan/mappia.git
```

Navigate to the project directory:

```bash
cd mappia
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Alternatively:

```bash
ng serve
```

Open the application at:

```text
http://localhost:4200
```

Create a production build:

```bash
npm run build
```

## ▶️ Usage

1. Start the Angular development server.
2. Open Mappia in a modern browser.
3. Import a supported local dataset.
4. Select the dataset from the layer manager.
5. Query table-backed datasets using the SQL editor.
6. Preview compatible spatial query results on the map.
7. Use the drawing and measurement tools when required.
8. Manage visibility, opacity and layer extent from the layer panel.

For GeoParquet datasets, use DuckDB Spatial functions to convert WKB geometry into WKT or GeoJSON before attempting map visualization.

## ⚙️ Configuration

Application-level settings are managed through Angular services and configuration files.

Configurable areas may include:

* Basemap style URL
* Initial map center
* Initial zoom level
* DuckDB WASM bundle
* DuckDB Spatial extension loading
* Query-result row limits
* Geometry-column detection
* Natural-language query provider
* Remote AI provider settings
* Layer styling defaults

External AI providers should not be enabled without securely managing API credentials.

## ⚠️ Current Limitations

* Local COG files are not yet rendered as raster map layers
* Raster reprojection is not yet implemented
* GeoParquet visualization depends on DuckDB Spatial availability
* Geometry detection currently relies on supported column names
* Natural-language SQL generation is rule based
* Styling options are limited
* Dataset editing is not yet supported
* Dataset export is not yet supported
* Large datasets remain subject to browser memory limits
* Spatial analysis workflows are still under development

## 🛣️ Roadmap

Planned improvements include:

* Full COG rendering
* Raster band visualization
* Raster statistics and histograms
* Automatic GeoParquet geometry detection
* GeoParquet metadata parsing
* Schema-aware natural-language SQL
* OpenAI integration
* Ollama integration
* Query history
* Workspace persistence
* Dataset export
* Attribute-table filtering
* Vector styling controls
* Coordinate-system inspection
* Client-side format conversion
* Additional DuckDB Spatial workflows
* Multi-layer spatial analysis

## 🔒 Privacy

Supported local datasets are processed directly in the browser and do not need to be uploaded to an application server.

External network communication may still occur when:

* Loading basemap resources
* Opening remote COG URLs
* Accessing externally hosted map services
* Using future external AI providers

## 🤝 Contributing

Contributions and improvements are welcome.

You can:

* Open issues for bugs or feature requests
* Submit pull requests with fixes or enhancements
* Improve dataset-format support
* Add new DuckDB Spatial workflows
* Improve raster rendering
* Extend natural-language query providers
* Improve documentation

Please respect third-party licenses when adding new dependencies.

## 👤 Author

**Oğuzhan CANDEMİR** — Geospatial Software Engineer

GitHub: [@candemiroguzhan](https://github.com/candemiroguzhan)

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## ⭐ Support

If you find this project useful:

* Star the repository ⭐
* Share feedback
* Report bugs
* Suggest new geospatial workflows
* Contribute enhancements

Thank you for your support!
