import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartType, ReportType } from './reportDefinitions';

export type ChartDatum = { name: string; [key: string]: string | number };
const colors = ['#304a6d', '#3b82f6', '#64748b', '#94a3b8', '#0d9488', '#a5b4fc'];
export function ReportChart({ report, metric, type, data, plotHeight }: { report: ReportType; metric: string; type: ChartType; data: ChartDatum[]; plotHeight?: number }) {
  const [width, setWidth] = useState(400);
  const series = metric === 'flujo' ? [{ key: 'entradas', label: 'Entradas' }, { key: 'salidas', label: 'Salidas finales' }]
    : metric === 'brecha' ? [{ key: 'actual', label: 'Stock actual' }, { key: 'minimo', label: 'Mínimo' }]
    : metric === 'destino' ? [{ key: 'hospital', label: 'Hospital' }, { key: 'casa', label: 'Para casa' }]
    : [{ key: metric, label: ({ stock: 'Stock', faltante: 'Faltante', dias: 'Días restantes', cantidad: 'Cantidad', total: 'Total', hospital: 'Hospital', casa: 'Para casa', traslados: 'Traslados' } as Record<string, string>)[metric] || metric }];
  if (!data.length) return <div className="min-h-64 grid place-items-center text-center text-sm text-slate-500 p-5">No hay datos para esta gráfica con los filtros actuales.</div>;
  const tooltip = <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', maxWidth: 280, whiteSpace: 'normal', overflowWrap: 'anywhere' }} />;
  if (type === 'pie') {
    const pieData = metric === 'flujo' ? series.map(s => ({ name: s.label, value: data.reduce((n, d) => n + Number(d[s.key] || 0), 0) })) : data.map(d => ({ name: d.name, value: Number(d[metric]) }));
    const positive = pieData.filter(d => Number.isFinite(d.value) && d.value > 0);
    if (!positive.length) return <div className="min-h-64 grid place-items-center text-sm text-slate-500">No hay cantidades positivas para distribuir.</div>;
    return <div className="w-full min-w-0">
      <div style={{ height: plotHeight || 320 }} className="w-full min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={positive} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="80%" paddingAngle={2} isAnimationActive={false}>{positive.map((d, i) => <Cell key={d.name} fill={colors[i % colors.length]} />)}</Pie>{tooltip}</PieChart></ResponsiveContainer></div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 px-2 pb-2">{positive.map((d, i) => <li key={d.name} className="flex gap-2 text-xs text-slate-600 min-w-0"><span style={{ backgroundColor: colors[i % colors.length] }} className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" /><span className="break-words min-w-0">{d.name}: <b>{d.value.toLocaleString('es-NI')}</b></span></li>)}</ul>
    </div>;
  }
  const temporal = report === 'movimientos';
  const height = Math.max(plotHeight || 0, temporal ? 340 : Math.max(300, data.length * (series.length > 1 && metric !== 'destino' ? 60 : 44) + 50));
  const labelWidth = Math.max(72, Math.min(145, width * 0.3));
  const shorten = (name: string) => name.length > (width < 420 ? 16 : 24) ? `${name.slice(0, width < 420 ? 14 : 22)}…` : name;
  return <div style={{ maxHeight: plotHeight ? plotHeight + 40 : undefined, overflowY: "auto" }} className="min-w-0 w-full">
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 px-2 pb-3">{series.map((s, i) => <span key={s.key} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />{s.label}</span>)}</div>
    <div style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} onResize={next => setWidth(next)}>
        {type === 'area' ? <AreaChart data={data} margin={{ top: 8, right: 20, bottom: 12, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" minTickGap={35} tick={{ fontSize: 11 }} tickFormatter={v => String(v).slice(5)} height={35} /><YAxis tick={{ fontSize: 11 }} width={42} />{tooltip}{series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={colors[i]} fill={colors[i]} fillOpacity={0.15} isAnimationActive={false} />)}</AreaChart>
          : <BarChart data={data} layout={temporal ? 'horizontal' : 'vertical'} margin={{ top: 8, right: 20, bottom: 10, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={temporal} horizontal={!temporal} stroke="#f1f5f9" />{temporal ? <><XAxis dataKey="name" minTickGap={35} tick={{ fontSize: 11 }} tickFormatter={v => String(v).slice(5)} height={35} /><YAxis width={42} tick={{ fontSize: 11 }} /></> : <><XAxis type="number" allowDecimals={metric === 'dias'} tick={{ fontSize: 11 }} height={30} /><YAxis type="category" dataKey="name" width={labelWidth} tick={{ fontSize: 11 }} tickFormatter={shorten} interval={0} /></>}{tooltip}{series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={colors[i]} maxBarSize={22} stackId={metric === 'destino' ? 'destino' : undefined} radius={temporal ? [4, 4, 0, 0] : [0, 4, 4, 0]} isAnimationActive={false} />)}</BarChart>}
      </ResponsiveContainer>
    </div>
  </div>;
}
