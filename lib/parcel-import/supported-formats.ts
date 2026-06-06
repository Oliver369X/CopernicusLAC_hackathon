export interface ImportFormatInfo {
  id: string;
  extensions: string[];
  label: string;
  source: string;
}

export const SUPPORTED_IMPORT_FORMATS: ImportFormatInfo[] = [
  {
    id: 'geojson',
    extensions: ['.geojson', '.json'],
    label: 'GeoJSON',
    source: 'QGIS, ArcGIS, Google Earth',
  },
  {
    id: 'shapefile',
    extensions: ['.zip'],
    label: 'Shapefile (ZIP)',
    source: 'QGIS, ArcGIS — exportar .shp + .shx + .dbf en ZIP',
  },
  {
    id: 'kml',
    extensions: ['.kml', '.kmz'],
    label: 'KML / KMZ',
    source: 'Google Earth, QGIS',
  },
  {
    id: 'csv',
    extensions: ['.csv'],
    label: 'CSV',
    source: 'Excel, planilla propia (WKT o lat/lng + radio)',
  },
];

export const IMPORT_ACCEPT =
  '.geojson,.json,.kml,.kmz,.csv,.zip,application/json,application/vnd.google-earth.kml+xml';

export const QGIS_EXPORT_STEPS = [
  'Capa de parcela → clic derecho → Exportar → Guardar entidades como…',
  'Formato recomendado: GeoJSON (.geojson) o ESRI Shapefile (.zip)',
  'Sistema de coordenadas: EPSG:4326 (WGS 84)',
  'Incluí atributos: nombre, cultivo (soybean/wheat/corn) si podés',
];
