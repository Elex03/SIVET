import { chartRows, palettes } from '../Reportes/chartOptions';
import type { ChartDatum } from '../Reportes/ReportChart';

/** Small, static dashboard summary. Full datasets remain available in reports. */
export default function DashboardChart({ data, metric }: { data: ChartDatum[]; metric: string }) {
  const series = metric === 'flujo'
    ? [{ key: 'entradas', label: 'Entradas' }, { key: 'salidas', label: 'Salidas finales' }]
    : [{ key: metric, label: metric === 'cantidad' ? 'Existencias' : 'Salidas' }];
  const positive = data.filter(row => series.some(s => Number(row[s.key]) > 0));
  const rows = chartRows(positive, metric, { sort: 'desc', limit: 5 }, false);
  const maximum = Math.max(1, ...rows.flatMap(row => series.map(s => Number(row[s.key]) || 0)));
  const format = (value: number) => value.toLocaleString('es-NI', { maximumFractionDigits: 6 });
  if (!rows.length) return <p className="py-12 text-center text-sm text-slate-500">No hay datos para los filtros seleccionados.</p>;
  return <div className="w-full min-w-0 space-y-4">
    <p className="text-xs text-slate-500">{positive.length > 5 ? `Top 5 de ${positive.length}` : `${rows.length} elementos`} · De mayor a menor{metric === 'flujo' ? ' por entradas + salidas' : ''}</p>
    <ol className="space-y-4">
      {rows.map((row, index) => <li key={row.name} className="min-w-0 space-y-1.5">
        <p className="text-sm font-medium text-[#304a6d] break-words [overflow-wrap:anywhere]"><span className="text-slate-400 mr-2">{index + 1}.</span>{row.name}</p>
        {series.map((s, i) => {
          const value = Number(row[s.key]) || 0;
          return <div key={s.key} className="min-w-0">
            <div className="flex flex-wrap justify-between gap-x-3 text-xs text-slate-500 mb-1"><span>{s.label}</span><span className="font-semibold tabular-nums text-[#304a6d]">{format(value)}</span></div>
            <div aria-hidden="true" className="h-2 w-full rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(0, value) / maximum * 100}%`, backgroundColor: palettes.mixed[series.length > 1 ? i : index] }} /></div>
          </div>;
        })}
      </li>)}
    </ol>
  </div>;
}
