import type { ChartWidget } from './ReportCanvas';
import type { ChartOptions } from './chartOptions';
export default function ChartSettings({ widget, temporal, onUpdate }: { widget: ChartWidget; temporal: boolean; onUpdate: (id: string, updates: Partial<ChartWidget>) => void }) {
  const options = widget.options || {};
  const change = (patch: Partial<ChartOptions>) => onUpdate(widget.id, { options: { ...options, ...patch } });
  const field = 'block w-full min-w-0 border border-slate-200 bg-white rounded-lg p-2 mt-1';
  return <details className="mb-3 rounded-xl border border-slate-200 text-xs text-slate-600"><summary className="cursor-pointer p-3 font-semibold">Comportamiento y apariencia</summary><div className="grid grid-cols-2 gap-3 px-3 pb-3">
    {!temporal && <label>Ordenar datos<select className={field} value={options.sort || 'default'} onChange={e => change({ sort: e.target.value as ChartOptions['sort'] })}><option value="default">Orden del reporte</option><option value="desc">Mayor a menor</option><option value="asc">Menor a mayor</option><option value="name">Nombre</option></select></label>}
    <label>{temporal ? 'Últimos períodos' : 'Elementos visibles'}<select className={field} value={options.limit || 0} onChange={e => change({ limit: Number(e.target.value) })}><option value={0}>Todos</option>{[5,10,20].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
    {widget.chartType === 'bar' && <label>Orientación<select className={field} value={options.orientation || (temporal ? 'vertical' : 'horizontal')} onChange={e => change({ orientation: e.target.value as ChartOptions['orientation'] })}><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select></label>}
    <label>Colores<select className={field} value={options.palette || 'blue'} onChange={e => change({ palette: e.target.value as ChartOptions['palette'] })}><option value="blue">Institucional</option><option value="teal">Verdes y turquesa</option><option value="warm">Cálidos</option></select></label>
    {(widget.chartType === 'area' || widget.chartType === 'line') && <label>Trazo<select className={field} value={options.curve || 'monotone'} onChange={e => change({ curve: e.target.value as ChartOptions['curve'] })}><option value="monotone">Suave</option><option value="linear">Recto</option><option value="step">Escalonado</option></select></label>}
    {widget.chartType === 'pie' && <label>Forma<select className={field} value={options.donut === false ? 'pie' : 'donut'} onChange={e => change({ donut: e.target.value === 'donut' })}><option value="donut">Dona</option><option value="pie">Pastel</option></select></label>}
    <label className="flex items-center gap-2"><input type="checkbox" checked={options.legend !== false} onChange={e => change({ legend: e.target.checked })} />Mostrar leyenda</label>
    <label className="flex items-center gap-2"><input type="checkbox" checked={!!options.values} onChange={e => change({ values: e.target.checked })} />Mostrar valores</label>
    {['flujo','destino','brecha'].includes(widget.metric) && widget.chartType === 'bar' && <label className="flex items-center gap-2"><input type="checkbox" checked={options.stacked ?? widget.metric === 'destino'} onChange={e => change({ stacked: e.target.checked })} />Apilar series</label>}
    <button type="button" className="text-blue-600 text-left font-semibold" onClick={() => onUpdate(widget.id, { options: {} })}>Restablecer opciones</button>
  </div></details>;
}
