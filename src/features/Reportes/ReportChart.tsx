import { chartRows, palettes } from './chartOptions';
import type { ChartOptions } from './chartOptions';
import { useState } from 'react';
import { ComposedChart, Area, Line, LabelList, BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartType, ReportType } from './reportDefinitions';

export type ChartDatum = { name: string; [key: string]: string | number };
export function ReportChart({ report, metric, type, data: sourceData, plotHeight, options = {} }: { report: ReportType; metric: string; type: ChartType; data: ChartDatum[]; plotHeight?: number; options?: ChartOptions }) {
  const colors = palettes[options.palette || 'blue']; const data = chartRows(sourceData, metric, options, report === 'movimientos');
  const [width, setWidth] = useState(400);
  const series = metric === 'flujo' ? [{ key: 'entradas', label: 'Entradas' }, { key: 'salidas', label: 'Salidas finales' }]
    : metric === 'brecha' ? [{ key: 'actual', label: 'Stock actual' }, { key: 'minimo', label: 'Mínimo' }]
    : metric === 'destino' ? [{ key: 'hospital', label: 'Hospital' }, { key: 'casa', label: 'Para casa' }]
    : [{ key: metric, label: ({ sinFecha: 'Sin vencimiento conocido', stock: 'Stock', faltante: 'Faltante', dias: 'Días restantes', cantidad: 'Cantidad', total: 'Total', hospital: 'Hospital', casa: 'Para casa', traslados: 'Traslados' } as Record<string, string>)[metric] || metric }];
  if (!data.length) return <div className="min-h-64 grid place-items-center text-center text-sm text-slate-500 p-5">No hay datos para esta gráfica con los filtros actuales.</div>;
  const tooltip = <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', maxWidth: 280, whiteSpace: 'normal', overflowWrap: 'anywhere' }} />;
  if (type === 'pie') {
    const pieData = metric === 'flujo' ? series.map(s => ({ name: s.label, value: data.reduce((n, d) => n + Number(d[s.key] || 0), 0) })) : data.map(d => ({ name: d.name, value: Number(d[metric]) }));
    const positive = pieData.filter(d => Number.isFinite(d.value) && d.value > 0);
    if (!positive.length) return <div className="min-h-64 grid place-items-center text-sm text-slate-500">No hay cantidades positivas para distribuir.</div>;
    return <div className="w-full min-w-0">
      <div style={{ height: plotHeight || 320 }} className="w-full min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={positive} dataKey="value" nameKey="name" innerRadius={options.donut === false ? 0 : "48%"} label={!!options.values} labelLine={!!options.values} outerRadius="80%" paddingAngle={2} isAnimationActive={false}>{positive.map((d, i) => <Cell key={d.name} fill={colors[i % colors.length]} />)}</Pie>{tooltip}</PieChart></ResponsiveContainer></div>
      {options.legend !== false && <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 px-2 pb-2">{positive.map((d, i) => <li key={d.name} className="flex gap-2 text-xs text-slate-600 min-w-0"><span style={{ backgroundColor: colors[i % colors.length] }} className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" /><span className="break-words min-w-0">{d.name}: <b>{d.value.toLocaleString('es-NI')}</b></span></li>)}</ul>}
    </div>;
  }
  const temporal = report === 'movimientos'; const horizontal = options.orientation ? options.orientation === 'horizontal' : !temporal;
  const height = Math.max(plotHeight || 0, temporal ? 340 : Math.max(300, data.length * (series.length > 1 && metric !== 'destino' ? 60 : 44) + 50));
  const labelWidth = Math.max(72, Math.min(145, width * 0.3));
  const shorten = (name: string) => name.length > (width < 420 ? 16 : 24) ? `${name.slice(0, width < 420 ? 14 : 22)}…` : name;
  return <div data-chart-scroll style={{ maxHeight: plotHeight ? plotHeight + 40 : undefined, overflowY: "auto" }} className="min-w-0 w-full">
    {options.legend !== false && <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 px-2 pb-3">{series.map((s, i) => <span key={s.key} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />{s.label}</span>)}</div>}
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} onResize={next => setWidth(next)}>
        {(type === 'area' || type === 'line') ? <ComposedChart data={data} margin={{ top: options.values ? 24 : 8, right: options.values ? 56 : 20, bottom: 12, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" minTickGap={35} tick={{ fontSize: 11 }} tickFormatter={v => temporal ? String(v).slice(5) : shorten(String(v))} height={35} /><YAxis tick={{ fontSize: 11 }} width={42} />{tooltip}{series.map((s, i) => type === 'line' ? <Line key={s.key} type={options.curve || 'monotone'} dataKey={s.key} name={s.label} stroke={colors[i]} strokeWidth={2} dot={false} isAnimationActive={false}>{options.values && <LabelList dataKey={s.key} position="top" fontSize={10} />}</Line> : <Area key={s.key} type={options.curve || 'monotone'} dataKey={s.key} name={s.label} stroke={colors[i]} fill={colors[i]} fillOpacity={0.15} isAnimationActive={false}>{options.values && <LabelList dataKey={s.key} position="top" fontSize={10} />}</Area>)}</ComposedChart>
          : <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: options.values ? 24 : 8, right: options.values ? 56 : 20, bottom: 10, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={!horizontal} horizontal={horizontal} stroke="#f1f5f9" />{!horizontal ? <><XAxis dataKey="name" minTickGap={35} tick={{ fontSize: 11 }} tickFormatter={v => temporal ? String(v).slice(5) : shorten(String(v))} height={35} /><YAxis width={42} tick={{ fontSize: 11 }} /></> : <><XAxis type="number" allowDecimals={metric === 'dias'} tick={{ fontSize: 11 }} height={30} /><YAxis type="category" dataKey="name" width={labelWidth} tick={{ fontSize: 11 }} tickFormatter={shorten} interval={0} /></>}{tooltip}{series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={colors[i]} maxBarSize={22} stackId={(options.stacked ?? metric === 'destino') ? 'series' : undefined} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} isAnimationActive={false}>{options.values && <LabelList dataKey={s.key} position={horizontal ? 'right' : 'top'} fontSize={10} />}</Bar>)}</BarChart>}
      </ResponsiveContainer>
    </div>
  </div>;
}
