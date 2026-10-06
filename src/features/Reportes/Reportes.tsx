import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileSearch, GripVertical, Layout, Settings2 } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../../shared/components/Layout/PageHeader';
import DataFeedback from '../../shared/components/Layout/DataFeedback';
import Table from '../../shared/components/Table/Table';
import { useSivet } from '../../shared/api/useSivet';
import { newId, today } from '../../shared/api/domain';
import { selectReports } from '../../shared/api/reports';
import { buttonClass, inputClass } from '../../shared/styles/formStyles';
import { exportReport } from '../../shared/utils/reportExport';
import { useConfirmation } from '../../shared/context/confirmation';
import { reportDefinitions } from './reportDefinitions';
import type { ChartType, ReportType } from './reportDefinitions';
import type { ChartDatum } from './ReportChart';
import ReportCanvas, { dragType } from './ReportCanvas';
import type { ChartDrop, ChartWidget } from './ReportCanvas';

export default function Reportes() {
  const state = useSivet();
  const confirm = useConfirmation();
  const [params, setParams] = useSearchParams();
  const report: ReportType = reportDefinitions.find(r => r.id === params.get('tipo'))?.id || 'existencias';
  const definition = reportDefinitions.find(r => r.id === report)!;
  const [tab, setTab] = useState<'config' | 'charts'>('config');
  const [period, setPeriod] = useState('30');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [place, setPlace] = useState('todas');
  const [category, setCategory] = useState('todas');
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Each report keeps its own arrangement while the user switches between reports.
  const [layouts, setLayouts] = useState<Partial<Record<ReportType, ChartWidget[]>>>({});
  const widgets = layouts[report] || [];
  const setWidgets = (update: (previous: ChartWidget[]) => ChartWidget[]) => setLayouts(previous => ({ ...previous, [report]: update(previous[report] || []) }));
  const [slotCount, setSlotCount] = useState(4);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const count = Math.max(slotCount, ...widgets.map(w => w.slot + 2));
  const reports = selectReports(state.data, period, from, to, place, category);
  const table = reports.tables[report];
  const chartData = reports.charts[report] as ChartDatum[];
  const temporal = report === 'movimientos' || report === 'salidas_area' || report === 'auditoria';
  const invalidDates = temporal && period === 'custom' && (!from || !to || from > to);
  const dates = temporal ? period === 'custom' ? `${from} al ${to}` : `Últimos ${period} días` : `Existencias actuales · ${today()}`;
  const subtitle = `${dates} | ${place === 'todas' ? 'Todas las ubicaciones' : place} | ${report === 'auditoria' ? 'Todas las acciones' : category === 'todas' ? 'Todas las categorías' : category}`;

  function addChart(template: { metric: string; chartType: ChartType }, target?: number) {
    if (!generated) { toast.info('Carga el reporte para agregar gráficas.'); return; }
    const metric = definition.metrics.find(m => m.id === template.metric);
    if (!metric?.types.includes(template.chartType)) return;
    const slot = target ?? (!widgets.some(w => w.slot === selectedSlot) ? selectedSlot : Array.from({ length: count }, (_, i) => i).find(i => !widgets.some(w => w.slot === i)));
    if (slot === undefined || widgets.some(w => w.slot === slot)) { toast.info('Ese espacio ya tiene una gráfica. Elige un espacio vacío o agrega otro.'); return; }
    setWidgets(previous => [...previous, { id: newId(), slot, metric: template.metric, chartType: template.chartType, isFullWidth: false }]);
    setSelectedSlot(slot);
  }
  function dropChart(payload: ChartDrop, slot: number) {
    if (!payload || slot < 0 || slot >= count) return;
    if (payload.kind === 'template') { addChart(payload, slot); return; }
    if (payload.kind !== 'widget') return;
    const source = widgets.find(w => w.id === payload.id);
    if (!source || source.slot === slot) return;
    setWidgets(previous => previous.map(w => w.id === source.id ? { ...w, slot } : w.slot === slot ? { ...w, slot: source.slot } : w));
    setSelectedSlot(slot);
  }
  async function generate() {
    if (invalidDates) return;
    setGenerating(true);
    await state.refresh();
    setGenerating(false);
    setGenerated(true);
    setTab('charts');
    if (!widgets.length) {
      const template = definition.templates[0];
      setWidgets(() => [{ id: newId(), slot: 0, metric: template.metric, chartType: template.chartType, isFullWidth: false }]);
      setSelectedSlot(1);
    }
  }
  async function download() {
    setExporting(true);
    const notice = toast.loading('Generando PDF con las gráficas y todos los registros…');
    try {
      await exportReport(definition.title, subtitle, table);
      toast.update(notice, { render: 'Reporte generado correctamente.', type: 'success', isLoading: false, autoClose: 4500, closeButton: true });
    } catch {
      toast.update(notice, { render: 'No se pudo generar el PDF. Inténtalo nuevamente.', type: 'error', isLoading: false, autoClose: 6000, closeButton: true });
    } finally { setExporting(false); }
  }

  return <div className="screen-page w-full max-w-[1600px] mx-auto flex flex-col gap-5 min-w-0">
    <PageHeader university header="Generador de Reportes Dinámicos" sub="Elige un reporte, organiza sus gráficas y ajusta el ancho de cada una." />
    <DataFeedback {...state} />
    <div className="report-workspace">
      <aside aria-label="Configuración del reporte" tabIndex={0} className="report-filters bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
        <div className="report-filter-tabs grid grid-cols-2 bg-slate-100 rounded-xl p-1 mb-5">
          <button onClick={() => setTab('config')} className={`rounded-lg py-2 text-xs font-bold flex gap-2 items-center justify-center ${tab === 'config' ? 'bg-white text-[#304a6d] shadow-sm' : 'text-slate-500'}`}><Settings2 size={16} />Configuración</button>
          <button onClick={() => setTab('charts')} className={`rounded-lg py-2 text-xs font-bold flex gap-2 items-center justify-center ${tab === 'charts' ? 'bg-white text-[#304a6d] shadow-sm' : 'text-slate-500'}`}><Layout size={16} />Gráficas</button>
        </div>
        {tab === 'config' ? <div className="flex flex-col gap-5">
          <div><h2 className="text-sm font-bold text-[#304a6d] mb-3">1. Tipo de reporte</h2><div className="flex flex-col gap-2">{reportDefinitions.map(r => <button key={r.id} onClick={() => { setParams({ tipo: r.id }); setGenerated(false); setSelectedSlot(0); }} className={`text-left p-3 rounded-xl border ${r.id === report ? 'border-blue-400 bg-blue-50/50' : 'border-slate-100 hover:border-slate-300'}`}><strong className="block text-sm text-[#304a6d]">{r.title}</strong><span className="block text-xs text-slate-500 mt-1">{r.desc}</span></button>)}</div></div>
          <div className="flex flex-col gap-4 border-t border-slate-100 pt-4"><h2 className="text-sm font-bold text-[#304a6d]">2. Filtros</h2>
            {temporal ? <><label className="text-xs text-slate-500 font-semibold">Período<select className={inputClass} value={period} onChange={e => { setPeriod(e.target.value); setGenerated(false); }}><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="custom">Personalizado</option></select></label>{period === 'custom' && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3"><label className="text-xs text-slate-500">Desde<input className={inputClass} type="date" value={from} onChange={e => { setFrom(e.target.value); setGenerated(false); }} /></label><label className="text-xs text-slate-500">Hasta<input className={inputClass} type="date" value={to} onChange={e => { setTo(e.target.value); setGenerated(false); }} /></label></div>}</> : <p className="text-xs text-slate-500">Este reporte refleja las existencias actuales.</p>}
            <label className="text-xs text-slate-500 font-semibold">Ubicación<select className={inputClass} value={place} onChange={e => { setPlace(e.target.value); setGenerated(false); }}><option value="todas">Todas las ubicaciones</option><option>Bodega Central</option><option>Farmacia</option></select></label>
            {report !== 'auditoria' && <label className="text-xs text-slate-500 font-semibold">Categoría<select className={inputClass} value={category} onChange={e => { setCategory(e.target.value); setGenerated(false); }}><option value="todas">Todas las categorías</option>{[...new Set(state.data.catalogos.filter(p => p.tipo === 'medicamentos').map(p => p.categoria).filter(Boolean))].map(c => <option key={c}>{c}</option>)}</select></label>}
          </div>
          {invalidDates && <p role="alert" className="text-sm text-rose-600">Indica un intervalo de fechas válido.</p>}
          <button onClick={() => void generate()} disabled={generating || state.loading || invalidDates} className={`${buttonClass} flex gap-2 justify-center items-center`}><FileSearch size={17} />{generating ? 'Cargando…' : 'Cargar reporte'}</button>
        </div> : <div className="flex flex-col gap-3"><h2 className="text-sm font-bold text-[#304a6d]">Gráficas para {definition.title}</h2><p className="text-xs text-slate-500">Arrastra una plantilla al lienzo o pulsa Agregar. Cada gráfica tiene su propio control de ancho.</p>
          {definition.templates.map(template => <div key={template.label} draggable={generated} onDragStart={e => { e.dataTransfer.setData(dragType, JSON.stringify({ kind: 'template', metric: template.metric, chartType: template.chartType })); e.dataTransfer.effectAllowed = 'copy'; }} className={`p-4 border border-slate-200 rounded-xl bg-white ${generated ? 'cursor-grab active:cursor-grabbing hover:border-blue-400' : 'opacity-50'}`}><div className="flex gap-2"><GripVertical className="text-slate-400 shrink-0" size={18} /><div className="min-w-0"><h3 className="text-sm font-semibold text-[#304a6d]">{template.label}</h3><p className="text-xs text-slate-500 mt-1">{template.chartType === 'bar' ? 'Barras' : template.chartType === 'area' ? 'Área temporal' : 'Pastel'}</p></div></div><button disabled={!generated} className="mt-3 text-sm font-bold text-blue-600 disabled:text-slate-400" onClick={() => addChart(template)}>+ Agregar</button></div>)}
          {!generated && <button className={buttonClass} disabled={generating || state.loading || invalidDates} onClick={() => void generate()}>Cargar reporte</button>}
        </div>}
      </aside>
      <main aria-label="Vista previa del reporte" tabIndex={0} className="report-preview min-w-0 bg-white rounded-2xl border border-slate-100 p-3 sm:p-5">
        {generated ? <><div className="flex flex-wrap justify-between gap-4 border-b border-slate-100 pb-4 mb-5"><div className="min-w-0"><h2 className="font-bold text-lg text-[#304a6d]">{definition.title}</h2><p className="text-xs text-slate-500 mt-1 break-words">{subtitle}</p></div><button disabled={exporting} onClick={() => void download()} className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-sm font-bold"><Download size={16} />{exporting ? 'Exportando…' : 'Exportar PDF'}</button></div>
          <ReportCanvas key={report} report={report} data={chartData} widgets={widgets} count={count} selected={selectedSlot} onSelect={slot => { setSelectedSlot(slot); setTab('charts'); }} onDrop={dropChart} onUpdate={(id, updates) => setWidgets(previous => previous.map(w => w.id === id ? { ...w, ...updates } : w))} onRemove={async id => { if (await confirm({ title: '¿Quitar esta gráfica?', description: 'La gráfica se retirará y las demás se acomodarán automáticamente.', confirmLabel: 'Quitar gráfica' })) { setWidgets(previous => previous.filter(w => w.id !== id)); toast.info('Gráfica retirada del reporte.'); } }} onAddSlot={() => { setSlotCount(count + 1); setSelectedSlot(count); }} />
          <h3 className="font-bold text-[#304a6d] mt-8 mb-4">Tabla de datos</h3><Table columns={table.columns} data={table.data} exportTitle={definition.title} exportSubtitle={subtitle} />
        </> : <div className="min-h-[400px] flex flex-col justify-center items-center gap-4 text-center p-5"><FileSearch size={40} className="text-slate-300" /><h2 className="font-bold text-[#304a6d]">Área de trabajo del reporte</h2><p className="text-sm text-slate-500 max-w-md">Carga los datos y construye tu reporte con gráficas de ancho individual.</p></div>}
      </main>
    </div>
  </div>;
}
