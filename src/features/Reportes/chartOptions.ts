import type { ChartDatum } from './ReportChart';
export interface ChartOptions {
  orientation?: 'horizontal' | 'vertical';
  sort?: 'default' | 'asc' | 'desc' | 'name';
  limit?: number;
  palette?: 'blue' | 'teal' | 'warm';
  legend?: boolean;
  values?: boolean;
  stacked?: boolean;
  donut?: boolean;
  curve?: 'monotone' | 'linear' | 'step';
}
export const palettes = {
  blue: ['#304a6d', '#3b82f6', '#64748b', '#94a3b8', '#0d9488', '#a5b4fc'],
  teal: ['#0f766e', '#14b8a6', '#0891b2', '#67e8f9', '#4d7c0f', '#a3e635'],
  warm: ['#b45309', '#f59e0b', '#e11d48', '#fb7185', '#7c3aed', '#c4b5fd'],
};
export function chartRows(data: ChartDatum[], metric: string, options: ChartOptions, temporal: boolean) {
  const rows = [...data]; const value = (r: ChartDatum) => metric === 'flujo' ? Number(r.entradas || 0) + Number(r.salidas || 0) : metric === 'destino' ? Number(r.hospital || 0) + Number(r.casa || 0) : Number(r[metric === 'brecha' ? 'actual' : metric] || 0);
  if (temporal) rows.sort((a,b) => a.name.localeCompare(b.name));
  else if (options.sort === 'name') rows.sort((a,b) => a.name.localeCompare(b.name, 'es'));
  else if (options.sort === 'asc' || options.sort === 'desc') rows.sort((a,b) => (value(a) - value(b)) * (options.sort === 'asc' ? 1 : -1));
  const limit = options.limit ?? 0;
  return limit > 0 ? temporal ? rows.slice(-limit) : rows.slice(0, limit) : rows;
}
