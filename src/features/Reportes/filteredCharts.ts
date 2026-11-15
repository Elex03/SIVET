import type { ChartDatum } from './ReportChart';
import type { ReportType } from './reportDefinitions';

/** Aggregate the same filtered detail rows used by the table and document. */
export function filteredCharts(report: ReportType, data: object[]): ChartDatum[] {
  const totals = new Map<string, ChartDatum>();
  const rows: ChartDatum[] = [];
  for (const item of data) {
    const r = item as Record<string, unknown>;
    const text = (key: string) => String(r[key] ?? '');
    const number = (key: string) => Number(r[key]) || 0;
    if (report === 'bajo_stock') { rows.push({ name: text('medicamento'), actual: number('stock_actual'), minimo: number('minimo'), brecha: number('minimo') - number('stock_actual'), faltante: number('minimo') - number('stock_actual') }); continue; }
    if (report === 'vencimientos') { rows.push({ name: `${text('medicamento')} (${text('lote')})`, dias: number('dias'), cantidad: number('cantidad') }); continue; }
    if (report === 'salidas_area') { rows.push({ name: text('area'), hospital: number('hospital'), casa: number('casa'), total: number('total') }); continue; }
    const name = text(report === 'existencias' ? 'producto' : report === 'movimientos' ? 'fecha' : report === 'donaciones' ? 'donante' : 'localidad');
    const key = report === 'existencias' ? text('productoId') || name : report === 'donaciones' ? name.trim().toLocaleLowerCase('es') : name;
    const row = totals.get(key) || { name };
    const add = (field: string, value: number) => { row[field] = Number(row[field] || 0) + value; };
    if (report === 'existencias') add('stock', number('stock'));
    else if (report === 'donaciones') { add('cantidad', number('cantidad')); add('sinFecha', number('sinFecha')); }
    else if (report === 'auditoria') add('cantidad', 1);
    else {
      for (const field of ['entradas', 'salidas', 'traslados']) row[field] ??= 0;
      add(r.tipo === 'ENTRADA' ? 'entradas' : r.tipo === 'SALIDA' ? 'salidas' : 'traslados', number('cantidad'));
    }
    totals.set(key, row);
  }
  const result = totals.size ? [...totals.values()] : rows;
  if (report === 'existencias') result.sort((a, b) => Number(b.stock) - Number(a.stock));
  if (report === 'movimientos') result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
