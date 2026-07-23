import { Injectable, effect, signal } from '@angular/core';

export type Language = 'en' | 'tr';

type TranslationKey =
  | 'app.subtitle'
  | 'aria.switchToDay'
  | 'aria.switchToNight'
  | 'aria.openContact'
  | 'aria.github'
  | 'aria.linkedin'
  | 'aria.email'
  | 'theme.day'
  | 'theme.night'
  | 'contact'
  | 'language'
  | 'layers'
  | 'layerManager'
  | 'close'
  | 'empty.layers'
  | 'workspaceLayer'
  | 'hideLayer'
  | 'showLayer'
  | 'layerStyleControls'
  | 'setLayerColor'
  | 'setLayerIcon'
  | 'zoom'
  | 'export'
  | 'remove'
  | 'features'
  | 'size'
  | 'bands'
  | 'file'
  | 'metadata'
  | 'tools'
  | 'drawingTools'
  | 'measurement'
  | 'aiTools'
  | 'sqlQueryTool'
  | 'addDrawings'
  | 'clearDrawings'
  | 'clearMeasurement'
  | 'import'
  | 'loadFromPc'
  | 'loadFromUrl'
  | 'remoteCogUrl'
  | 'load'
  | 'queryHistory'
  | 'history'
  | 'running'
  | 'run'
  | 'results'
  | 'rows'
  | 'showingFirst1000'
  | 'noQuery'
  | 'loadingResults'
  | 'uploadAndRun'
  | 'noRows'
  | 'tables'
  | 'empty.tables'
  | 'unknown'
  | 'geoparquetHints'
  | 'spatialUnavailable'
  | 'naturalLanguageQuery'
  | 'queryEntryField'
  | 'generating'
  | 'generateSql'
  | 'couldNotGenerateSql'
  | 'mapReadyFeatures'
  | 'addResultAsLayer'
  | 'visible'
  | 'layerCount'
  | 'openLayerManager'
  | 'openDrawingTools'
  | 'openMeasurementTools'
  | 'openAiTools'
  | 'panMap'
  | 'pan'
  | 'fitView'
  | 'resetView';

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'app.subtitle': 'Modern GIS Workbench',
    'aria.switchToDay': 'Switch to day mode',
    'aria.switchToNight': 'Switch to night mode',
    'aria.openContact': 'Open contact links',
    'aria.github': 'GitHub profile',
    'aria.linkedin': 'LinkedIn profile',
    'aria.email': 'Send email',
    'theme.day': 'Day mode',
    'theme.night': 'Night mode',
    contact: 'Contact',
    language: 'Language',
    layers: 'Layers',
    layerManager: 'Layer Manager',
    close: 'Close',
    'empty.layers': 'Upload GeoJSON, CSV, Parquet, GeoParquet or COG files to create layers.',
    workspaceLayer: 'workspace layer',
    hideLayer: 'Hide layer',
    showLayer: 'Show layer',
    layerStyleControls: 'Layer style controls',
    setLayerColor: 'Set layer color',
    setLayerIcon: 'Set layer icon',
    zoom: 'Zoom',
    export: 'Export',
    remove: 'Remove',
    features: 'features',
    size: 'Size',
    bands: 'Bands',
    file: 'File',
    metadata: 'Metadata',
    tools: 'Tools',
    drawingTools: 'Drawing Tools',
    measurement: 'Measurement',
    aiTools: 'AI Tools',
    sqlQueryTool: 'SQL Query Tool',
    addDrawings: 'Add drawings to layer manager',
    clearDrawings: 'Clear drawings',
    clearMeasurement: 'Clear measurement',
    import: 'Import',
    loadFromPc: 'Load from PC',
    loadFromUrl: 'Load from URL',
    remoteCogUrl: 'Remote COG URL',
    load: 'Load',
    queryHistory: 'Query history',
    history: 'History',
    running: 'Running',
    run: 'Run',
    results: 'Results',
    rows: 'rows',
    showingFirst1000: 'showing first 1000',
    noQuery: 'No query executed',
    loadingResults: 'Loading results...',
    uploadAndRun: 'Upload a file and run a query.',
    noRows: 'Query returned no rows.',
    tables: 'Tables',
    'empty.tables': 'Upload a CSV, Parquet or GeoParquet file.',
    unknown: 'Unknown',
    geoparquetHints: 'GeoParquet hints',
    spatialUnavailable: 'Spatial extension could not be loaded. WKB geometries remain visible in the table; map output needs WKT or GeoJSON columns.',
    naturalLanguageQuery: 'Natural language query',
    queryEntryField: 'Query entry field',
    generating: 'Generating',
    generateSql: 'Generate SQL',
    couldNotGenerateSql: 'Could not generate SQL.',
    mapReadyFeatures: 'map-ready features',
    addResultAsLayer: 'Add result as layer',
    visible: 'visible',
    layerCount: 'layers',
    openLayerManager: 'Open layer manager',
    openDrawingTools: 'Open drawing tools',
    openMeasurementTools: 'Open measurement tools',
    openAiTools: 'Open AI tools',
    panMap: 'Pan map',
    pan: 'Pan',
    fitView: 'Fit View',
    resetView: 'Reset View'
  },
  tr: {
    'app.subtitle': 'Modern CBS Calisma Alani',
    'aria.switchToDay': 'Gunduz moduna gec',
    'aria.switchToNight': 'Gece moduna gec',
    'aria.openContact': 'Iletisim baglantilarini ac',
    'aria.github': 'GitHub profili',
    'aria.linkedin': 'LinkedIn profili',
    'aria.email': 'E-posta gonder',
    'theme.day': 'Gunduz modu',
    'theme.night': 'Gece modu',
    contact: 'Iletisim',
    language: 'Dil',
    layers: 'Katmanlar',
    layerManager: 'Katman Yoneticisi',
    close: 'Kapat',
    'empty.layers': 'Katman olusturmak icin GeoJSON, CSV, Parquet, GeoParquet veya COG dosyalari yukleyin.',
    workspaceLayer: 'calisma alani katmani',
    hideLayer: 'Katmani gizle',
    showLayer: 'Katmani goster',
    layerStyleControls: 'Katman stil kontrolleri',
    setLayerColor: 'Katman rengini ayarla',
    setLayerIcon: 'Katman ikonunu ayarla',
    zoom: 'Yaklas',
    export: 'Disa aktar',
    remove: 'Kaldir',
    features: 'obje',
    size: 'Boyut',
    bands: 'Bantlar',
    file: 'Dosya',
    metadata: 'Metadata',
    tools: 'Araclar',
    drawingTools: 'Cizim Araclari',
    measurement: 'Olcum',
    aiTools: 'Yapay Zeka Araclari',
    sqlQueryTool: 'SQL Sorgu Araci',
    addDrawings: 'Cizimleri katman yoneticisine ekle',
    clearDrawings: 'Cizimleri temizle',
    clearMeasurement: 'Olcumu temizle',
    import: 'Ice aktar',
    loadFromPc: 'Bilgisayardan yukle',
    loadFromUrl: "URL'den yukle",
    remoteCogUrl: 'Uzak COG URL',
    load: 'Yukle',
    queryHistory: 'Sorgu gecmisi',
    history: 'Gecmis',
    running: 'Calisiyor',
    run: 'Calistir',
    results: 'Sonuclar',
    rows: 'satir',
    showingFirst1000: 'ilk 1000 gosteriliyor',
    noQuery: 'Henuz sorgu calistirilmadi',
    loadingResults: 'Sonuclar yukleniyor...',
    uploadAndRun: 'Bir dosya yukleyin ve sorgu calistirin.',
    noRows: 'Sorgu satir dondurmedi.',
    tables: 'Tablolar',
    'empty.tables': 'CSV, Parquet veya GeoParquet dosyasi yukleyin.',
    unknown: 'Bilinmiyor',
    geoparquetHints: 'GeoParquet ipuclari',
    spatialUnavailable: 'Spatial eklentisi yuklenemedi. WKB geometriler tabloda gorunur kalir; harita ciktisi icin WKT veya GeoJSON kolonlari gerekir.',
    naturalLanguageQuery: 'Dogal dil sorgusu',
    queryEntryField: 'Sorgu giris alani',
    generating: 'Uretiliyor',
    generateSql: 'SQL uret',
    couldNotGenerateSql: 'SQL uretilemedi.',
    mapReadyFeatures: 'haritaya hazir obje',
    addResultAsLayer: 'Sonucu katman olarak ekle',
    visible: 'gorunur',
    layerCount: 'katman',
    openLayerManager: 'Katman yoneticisini ac',
    openDrawingTools: 'Cizim araclarini ac',
    openMeasurementTools: 'Olcum araclarini ac',
    openAiTools: 'Yapay zeka araclarini ac',
    panMap: 'Haritayi kaydir',
    pan: 'Kaydir',
    fitView: 'Gorunume sigdir',
    resetView: 'Gorunumu sifirla'
  }
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'tr', label: 'TR' }
  ];

  readonly currentLanguage = signal<Language>(this.readInitialLanguage());

  constructor() {
    effect(() => {
      const language = this.currentLanguage();
      document.documentElement.lang = language;
      document.title = language === 'tr' ? 'mappia - Modern CBS Calisma Alani' : 'mappia - Modern GIS Workbench Studio';
      localStorage.setItem('mappia-language', language);
    });
  }

  setLanguage(language: Language): void {
    this.currentLanguage.set(language);
  }

  translate(key: TranslationKey): string {
    return translations[this.currentLanguage()][key] ?? translations.en[key] ?? key;
  }

  private readInitialLanguage(): Language {
    return localStorage.getItem('mappia-language') === 'tr' ? 'tr' : 'en';
  }
}
