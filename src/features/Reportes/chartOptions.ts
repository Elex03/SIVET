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
  blue: ['#355b7c', '#718ba2', '#505e6d', '#a8b7c6', '#577975', '#9292a6'],
  teal: ['#466e68', '#77968d', '#547b8a', '#9fb6bc', '#777c57', '#afb496'],
  warm: ['#896839', '#b39a6a', '#995d66', '#c49b9e', '#756581', '#aca0b6'],
};
export function chartRows(data: ChartDatum[], metric: string, options: ChartOptions, temporal: boolean) {
  const rows = [...data]; const value = (r: ChartDatum) => metric === 'flujo' ? Number(r.entradas || 0) + Number(r.salidas || 0) : metric === 'destino' ? Number(r.hospital || 0) + Number(r.casa || 0) : Number(r[metric === 'brecha' ? 'actual' : metric] || 0);
  if (temporal) rows.sort((a,b) => a.name.localeCompare(b.name));
  else if (options.sort === 'name') rows.sort((a,b) => a.name.localeCompare(b.name, 'es'));
  else if (options.sort === 'asc' || options.sort === 'desc') rows.sort((a,b) => (value(a) - value(b)) * (options.sort === 'asc' ? 1 : -1));
  const limit = options.limit ?? 0;
  return limit > 0 ? temporal ? rows.slice(-limit) : rows.slice(0, limit) : rows;
}
