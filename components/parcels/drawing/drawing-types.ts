export type DrawTool = 'draw_polygon' | 'simple_select';

export interface DrawingMetrics {
  areaHa: number;
  perimeterKm: number;
  centroid: [number, number] | null;
  vertexCount: number;
}
