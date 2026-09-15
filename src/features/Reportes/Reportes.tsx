import React, { useState } from "react";
import { 
  FileText, Calendar, Building2, Layers, 
  BarChart2, Clock, ArrowRightLeft, FileSearch, 
  Filter, Loader2, GripVertical, 
  PieChart as PieIcon, Download, X, AlertTriangle, Settings2,
  TrendingUp, Maximize2, Minimize2, Layout
} from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

import PageHeader from "../../shared/components/Layout/PageHeader";
import Table from "../../shared/components/Table/Table";
import { downloadCompleteReport } from "../../shared/utils/printUtils"; 

// Paleta institucional
const COLORS = ['#304a6d', '#3b82f6', '#64748b', '#94a3b8', '#cbd5e1'];

// ==========================================
// BASES DE DATOS SIMULADAS POR TIPO DE REPORTE
// ==========================================
const DATA_MOCKS: Record<string, any[]> = {
  existencias: [
    { name: "Amoxicilina 500mg", stock: 120, valor: 180 },
    { name: "Doxiciclina 100mg", stock: 85, valor: 178 },
    { name: "Jeringas 5ml", stock: 450, valor: 112 },
    { name: "Ivermectina", stock: 60, valor: 300 },
    { name: "Vitaminas", stock: 200, valor: 150 },
  ],
  movimientos: [
    { name: '01 Sep', entradas: 120, salidas: 80 }, 
    { name: '05 Sep', entradas: 145, salidas: 110 },
    { name: '10 Sep', entradas: 150, salidas: 90 }, 
    { name: '15 Sep', entradas: 80, salidas: 130 }
  ],
  bajo_stock: [
    { name: "Amoxicilina", actual: 4, minimo: 20 },
    { name: "Ibuprofeno", actual: 2, minimo: 15 },
    { name: "Oxitetraciclina", actual: 1, minimo: 10 },
  ],
  vencimientos: [
    { name: "Midazolam", dias: 15, cantidad: 40 },
    { name: "Prednisona", dias: 22, cantidad: 120 },
    { name: "Vacuna Rabia", dias: 45, cantidad: 15 },
  ]
};

const REPORT_TYPES = [
  { id: "existencias", title: "Inventario Actual", icon: <FileText size={18} />, desc: "Existencias y valoración actual del stock.", metrics: [{ id: "stock", label: "Top 5: Cantidad en Stock" }, { id: "valor", label: "Top 5: Valorización ($)" }] },
  { id: "movimientos", title: "Kardex / Movimientos", icon: <ArrowRightLeft size={18} />, desc: "Historial de entradas y salidas detalladas.", metrics: [{ id: "flujo", label: "Flujo Temporal (Entradas vs Salidas)" }] },
  { id: "bajo_stock", title: "Stock Crítico / Bajo", icon: <AlertTriangle size={18} />, desc: "Productos por debajo del nivel mínimo establecido.", metrics: [{ id: "brecha", label: "Brecha (Stock vs Mínimo)" }] },
  { id: "vencimientos", title: "Próximos a Vencer", icon: <Clock size={18} />, desc: "Lotes que caducan en los próximos 90 días.", metrics: [{ id: "dias", label: "Días restantes para caducar" }, { id: "cantidad", label: "Volumen en riesgo" }] },
];

interface ChartWidget {
  id: string;
  chartType: "bar" | "area" | "pie";
  metric: string;
  isFullWidth: boolean;
}

const Reportes: React.FC = () => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<"config" | "widgets">("config");

  const [activeReport, setActiveReport] = useState("existencias");
  
  // ==========================================
  // ESTADOS DE FILTROS (Restaurados y Completos)
  // ==========================================
  const [dateFilter, setDateFilter] = useState("30");
  const [fechaInicio, setFechaInicio] = useState("2026-08-14");
  const [fechaFin, setFechaFin] = useState("2026-09-14");
  const [bodega, setBodega] = useState("todas");
  const [categoria, setCategoria] = useState("todas");

  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [reportResultConfig, setReportResultConfig] = useState<any>(null);

  const [widgets, setWidgets] = useState<ChartWidget[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => e.dataTransfer.setData("action", "add_widget");

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const action = e.dataTransfer.getData("action");
    
    if (action === "add_widget") {
      const currentReportConf = REPORT_TYPES.find(r => r.id === activeReport);
      const newWidget: ChartWidget = {
        id: `widget_${Date.now()}`,
        chartType: "bar", 
        metric: currentReportConf?.metrics[0].id || "",
        isFullWidth: false 
      };
      setWidgets(prev => [...prev, newWidget]);
    }
  };

  const updateWidget = (id: string, updates: Partial<ChartWidget>) => setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  const removeWidget = (id: string) => setWidgets(prev => prev.filter(w => w.id !== id));

  // ==========================================
  // RENDERIZADOR DINÁMICO DE GRÁFICAS
  // ==========================================
  const renderChartGraphic = (widget: ChartWidget) => {
    const data = DATA_MOCKS[activeReport];
    if (!data) return null;

    if (widget.chartType === "pie") {
      const pieData = activeReport === "movimientos" 
        ? [{ name: 'Entradas', value: data.reduce((a, b) => a + b.entradas, 0) }, { name: 'Salidas', value: data.reduce((a, b) => a + b.salidas, 0) }]
        : data.map(d => ({ name: d.name, value: d[widget.metric] }));

      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
              {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)' }} />
            <Legend layout="horizontal" verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const renderKeys = () => {
      if (activeReport === "movimientos" && widget.metric === "flujo") {
        return (
          <>
            {widget.chartType === "area" && <><Area type="monotone" dataKey="entradas" stroke="#304a6d" fill="#304a6d" fillOpacity={0.1} /><Area type="monotone" dataKey="salidas" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} /></>}
            {widget.chartType === "bar" && <><Bar dataKey="entradas" fill="#304a6d" radius={[4,4,0,0]} /><Bar dataKey="salidas" fill="#94a3b8" radius={[4,4,0,0]} /></>}
          </>
        );
      }
      if (activeReport === "bajo_stock" && widget.metric === "brecha") {
        return (
          <>
            {widget.chartType === "area" && <><Area type="monotone" dataKey="actual" name="Stock Actual" stroke="#e11d48" fill="#e11d48" fillOpacity={0.1} /><Area type="monotone" dataKey="minimo" name="Mínimo Requerido" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} /></>}
            {widget.chartType === "bar" && <><Bar dataKey="actual" name="Stock Actual" fill="#e11d48" radius={[4,4,0,0]} /><Bar dataKey="minimo" name="Mínimo Requerido" fill="#94a3b8" radius={[4,4,0,0]} /></>}
          </>
        );
      }
      return (
        <>
          {widget.chartType === "area" && <Area type="monotone" dataKey={widget.metric} name={widget.metric.toUpperCase()} stroke="#304a6d" fill="#304a6d" fillOpacity={0.2} />}
          {widget.chartType === "bar" && <Bar dataKey={widget.metric} name={widget.metric.toUpperCase()} fill="#304a6d" radius={[4,4,0,0]} />}
        </>
      );
    };

    const ChartComponent = widget.chartType === "area" ? AreaChart : BarChart;

    return (
      <ResponsiveContainer width="100%" height="100%">
        {/* @ts-ignore */}
        <ChartComponent data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          {renderKeys()}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setHasGenerated(false);
    
    // Convertir el filtro de fecha a texto legible para el PDF
    const dateLabel = dateFilter === "custom" 
      ? `${fechaInicio} al ${fechaFin}` 
      : dateFilter === "7" ? "Últimos 7 días"
      : dateFilter === "30" ? "Últimos 30 días"
      : "Último Trimestre";

    const bodegaLabel = bodega === "todas" ? "Todas las Bodegas" 
      : bodega === "central" ? "Bodega Central UNA" : "Clínica Veterinaria";

    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
      setReportResultConfig({
        type: REPORT_TYPES.find(r => r.id === activeReport)?.title,
        dates: dateLabel,
        bodega: bodegaLabel,
        categoria: categoria === "todas" ? "Todas las Categorías" : categoria
      });
      setActiveSidebarTab("widgets");
    }, 1000);
  };

  const getTableConfig = () => {
    switch (activeReport) {
      case "existencias": return { columns: [{ id: "codigo", label: "Código", render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.codigo}</span> }, { id: "producto", label: "Producto", render: (r: any) => <span className="font-bold text-slate-800">{r.producto}</span> }, { id: "stock", label: "Stock", render: (r: any) => <span className="font-bold text-[#304a6d]">{r.stock}</span> }, { id: "valor_total", label: "Valor Total", render: (r: any) => <span className="font-semibold text-emerald-600">${r.valor_total}</span> }], data: [{ id: 1, codigo: "MED-001", producto: "Amoxicilina 500 mg", stock: 120, valor_total: "180.00" }, { id: 2, codigo: "MED-002", producto: "Doxiciclina 100 mg", stock: 85, valor_total: "178.50" }, { id: 3, codigo: "MAT-015", producto: "Jeringas 5ml", stock: 450, valor_total: "112.50" }] };
      case "movimientos": return { columns: [{ id: "fecha", label: "Fecha", render: (r: any) => <span className="text-slate-600 font-medium">{r.fecha}</span> }, { id: "tipo", label: "Movimiento", render: (r: any) => <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${r.tipo === 'ENTRADA' ? 'text-[#3b82f6] bg-blue-50' : 'text-slate-700 bg-slate-100'}`}>{r.tipo}</span>}, { id: "producto", label: "Producto", render: (r: any) => <span className="font-semibold text-slate-800">{r.producto}</span> }, { id: "cantidad", label: "Cant.", render: (r: any) => <span className="font-bold text-slate-700">{r.cantidad}</span> }], data: [{ id: 1, fecha: "12/09/2026", tipo: "ENTRADA", producto: "Amoxicilina 500 mg", cantidad: 50 }, { id: 2, fecha: "13/09/2026", tipo: "SALIDA", producto: "Jeringas 5ml", cantidad: 25 }, { id: 3, fecha: "14/09/2026", tipo: "SALIDA", producto: "Amoxicilina 500 mg", cantidad: 10 }] };
      case "bajo_stock": return { columns: [{ id: "codigo", label: "Código", render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.codigo}</span> }, { id: "producto", label: "Producto", render: (r: any) => <span className="font-bold text-slate-800">{r.producto}</span> }, { id: "stock_actual", label: "Stock actual", render: (r: any) => <span className="font-bold text-[#304a6d]">{r.stock_actual}</span> }, { id: "minimo", label: "Mínimo", render: (r: any) => <span className="text-slate-500">{r.minimo}</span> }, { id: "estado", label: "Estado", render: () => <span className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-md uppercase tracking-wider">Crítico</span> }], data: [{ id: 1, codigo: "MED-012", producto: "Amoxicilina 500 mg", stock_actual: 4, minimo: 20 }, { id: 2, codigo: "MED-045", producto: "Ibuprofeno 400 mg", stock_actual: 2, minimo: 15 }, { id: 3, codigo: "MED-089", producto: "Oxitetraciclina 20%", stock_actual: 1, minimo: 10 }] };
      case "vencimientos": return { columns: [{ id: "producto", label: "Producto", render: (r: any) => <span className="font-bold text-slate-800">{r.producto}</span> }, { id: "lote", label: "Lote", render: (r: any) => <span className="font-mono text-xs text-slate-500">{r.lote}</span> }, { id: "vencimiento", label: "Vencimiento", render: (r: any) => <span className="text-sm text-slate-700 font-medium">{r.vencimiento}</span> }, { id: "dias", label: "Alerta", render: (r: any) => <span className="text-amber-600 text-xs font-bold">En {r.dias} días</span> }], data: [{ id: 1, producto: "Amoxicilina 500 mg", lote: "L-458752", vencimiento: "15 Oct 2026", dias: 15 }, { id: 2, producto: "Midazolam 5mg", lote: "L-998120", vencimiento: "22 Oct 2026", dias: 22 }, { id: 3, producto: "Prednisona 50mg", lote: "L-112344", vencimiento: "15 Nov 2026", dias: 45 }] };
      default: return { columns: [], data: [] };
    }
  };

  const currentTableConfig = getTableConfig();
  const currentReportMetrics = REPORT_TYPES.find(r => r.id === activeReport)?.metrics || [];

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 pb-10 h-full">
      <PageHeader header="Generador de Reportes Dinámicos" sub="Configura el informe, arrastra gráficas interactivas y exporta a PDF." />

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* ========================================== */}
        {/* PANEL IZQUIERDO: CONFIGURACIÓN / WIDGETS */}
        {/* ========================================== */}
        <div className="w-full lg:w-[380px] flex-shrink-0 bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col h-fit">
          
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button onClick={() => setActiveSidebarTab("config")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeSidebarTab === "config" ? "bg-white text-[#304a6d] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Settings2 size={16} /> Configuración</button>
            <button onClick={() => setActiveSidebarTab("widgets")} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeSidebarTab === "widgets" ? "bg-white text-[#304a6d] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Layout size={16} /> Elementos UI</button>
          </div>

          {activeSidebarTab === "config" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-2 duration-200">
              
              {/* Tipo de Reporte */}
              <div>
                <h3 className="text-sm font-bold text-[#304a6d] flex items-center gap-2 mb-3"><BarChart2 size={16} /> 1. Tipo de Reporte</h3>
                <div className="flex flex-col gap-2">
                  {REPORT_TYPES.map((report) => (
                    <div key={report.id} onClick={() => { setActiveReport(report.id); setWidgets([]); }} className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${activeReport === report.id ? "border-[#3b82f6] bg-blue-50/50" : "border-slate-100 hover:border-slate-200"}`}>
                      <div className={`mt-0.5 ${activeReport === report.id ? "text-[#3b82f6]" : "text-slate-400"}`}>{report.icon}</div>
                      <div>
                        <h4 className={`text-sm font-bold ${activeReport === report.id ? "text-[#304a6d]" : "text-slate-700"}`}>{report.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{report.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filtros Completos */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-[#304a6d] flex items-center gap-2 mb-3"><Filter size={16} /> 2. Filtros</h3>
                
                <div className="flex flex-col gap-4">
                  {/* Selector de Rango de Fecha */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5"><Calendar size={13} /> Periodo</label>
                    <div className="flex flex-col gap-2">
                      <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] cursor-pointer"
                      >
                        <option value="7">Últimos 7 días</option>
                        <option value="30">Últimos 30 días</option>
                        <option value="90">Último Trimestre</option>
                        <option value="custom">Personalizado...</option>
                      </select>

                      {/* Opciones personalizadas de fecha */}
                      {dateFilter === "custom" && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6]" />
                          <span className="text-slate-400 text-sm">a</span>
                          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selector de Bodega */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5"><Building2 size={13} /> Bodega Origen</label>
                    <select value={bodega} onChange={(e) => setBodega(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] cursor-pointer">
                      <option value="todas">Todas las bodegas</option>
                      <option value="central">Bodega Central UNA</option>
                      <option value="clinica">Clínica Veterinaria</option>
                    </select>
                  </div>

                  {/* Selector de Categoría */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5"><Layers size={13} /> Categoría</label>
                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] cursor-pointer">
                      <option value="todas">Todos los insumos</option>
                      <option value="medicamentos">Medicamentos</option>
                      <option value="materiales">Material Médico</option>
                    </select>
                  </div>
                </div>
              </div>

              <button onClick={handleGenerateReport} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 bg-[#304a6d] hover:bg-[#233854] text-white px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-md">
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <FileSearch size={18} />} Cargar Datos
              </button>
            </div>
          )}

          {activeSidebarTab === "widgets" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-2 duration-200">
              {!hasGenerated ? (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500">Carga el reporte primero para habilitar los widgets.</p>
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-[#304a6d] flex items-center gap-2"><Layout size={16} /> Widgets Dinámicos</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Arrastra este bloque al reporte. Luego podrás configurar sus métricas y tamaño.</p>
                  </div>
                  
                  <div 
                    draggable onDragStart={handleDragStart} 
                    className="flex flex-col gap-2 bg-white border border-slate-200 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-[#3b82f6] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical size={16} className="text-slate-400 group-hover:text-[#3b82f6]" />
                      <div className="w-10 h-10 bg-blue-50 text-[#304a6d] rounded-xl flex items-center justify-center"><BarChart2 size={20} /></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">Nueva Gráfica</span>
                        <span className="text-[10px] text-slate-400 font-medium">Auto-ajustable al reporte</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* ========================================== */}
        {/* PANEL DERECHO: VISTA PREVIA Y DROPZONE */}
        {/* ========================================== */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
          
          {hasGenerated ? (
            <div className="flex flex-col h-full relative">
              <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h2 className="text-lg font-bold text-[#304a6d]">{reportResultConfig?.type}</h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {reportResultConfig?.dates} | {reportResultConfig?.bodega}
                  </p>
                </div>
                <button 
                  onClick={() => downloadCompleteReport('pdf-report-content', reportResultConfig?.type, `${reportResultConfig?.dates} | ${reportResultConfig?.bodega} | ${reportResultConfig?.categoria}`)} 
                  className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-rose-100 shadow-sm pdf-hide-btn"
                >
                  <Download size={16} /> Exportar (PDF)
                </button>
              </div>

              <div id="pdf-report-content" className="flex-1 flex flex-col p-6 bg-white overflow-y-auto">
                
                <div 
                  onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }} onDragLeave={() => setIsDraggingOver(false)}
                  className={`min-h-[120px] mb-6 rounded-2xl transition-all duration-300 border-2 border-dashed flex flex-col ${isDraggingOver ? 'border-[#3b82f6] bg-blue-50/50' : widgets.length === 0 ? 'border-slate-200 bg-slate-50/50 items-center justify-center' : 'border-transparent'}`}
                >
                  {widgets.length === 0 ? (
                    <p className="text-slate-400 font-medium text-sm pointer-events-none flex items-center gap-2">
                      <Layout size={18} /> Arrastra el widget de "Nueva Gráfica" aquí
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-full">
                      
                      {widgets.map(widget => (
                        <div key={widget.id} className={`bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col h-[340px] relative group recharts-wrapper transition-all duration-300 ${widget.isFullWidth ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
                          
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                            <select value={widget.metric} onChange={(e) => updateWidget(widget.id, { metric: e.target.value })} className="bg-slate-50 border border-slate-200 text-xs font-bold text-[#304a6d] rounded-lg px-2 py-1.5 outline-none cursor-pointer hide-in-pdf">
                              {currentReportMetrics.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                            </select>

                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 hide-in-pdf">
                              <button onClick={() => updateWidget(widget.id, { chartType: 'bar' })} className={`p-1.5 rounded-md transition-all ${widget.chartType === 'bar' ? 'bg-white shadow-sm text-[#3b82f6]' : 'text-slate-400 hover:text-slate-600'}`} title="Barras"><BarChart2 size={14}/></button>
                              <button onClick={() => updateWidget(widget.id, { chartType: 'area' })} className={`p-1.5 rounded-md transition-all ${widget.chartType === 'area' ? 'bg-white shadow-sm text-[#3b82f6]' : 'text-slate-400 hover:text-slate-600'}`} title="Área"><TrendingUp size={14}/></button>
                              <button onClick={() => updateWidget(widget.id, { chartType: 'pie' })} className={`p-1.5 rounded-md transition-all ${widget.chartType === 'pie' ? 'bg-white shadow-sm text-[#3b82f6]' : 'text-slate-400 hover:text-slate-600'}`} title="Pastel"><PieIcon size={14}/></button>
                            </div>

                            <div className="flex items-center gap-1 hide-in-pdf">
                              <button onClick={() => updateWidget(widget.id, { isFullWidth: !widget.isFullWidth })} className="p-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all" title="Cambiar tamaño">
                                {widget.isFullWidth ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
                              </button>
                              <button onClick={() => removeWidget(widget.id)} className="p-1.5 bg-rose-50 text-rose-500 rounded-lg border border-rose-100 hover:bg-rose-100 transition-all"><X size={14}/></button>
                            </div>
                            
                            <h4 className="hidden show-in-pdf text-sm font-bold text-[#304a6d] w-full">Gráfica: {currentReportMetrics.find(m => m.id === widget.metric)?.label}</h4>
                          </div>
                          
                          <div className="flex-1 w-full relative">
                            {renderChartGraphic(widget)}
                          </div>
                        </div>
                      ))}

                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#304a6d] mb-4 border-b border-slate-100 pb-2">Tabla de Datos</h3>
                <div className="flex-1"><Table columns={currentTableConfig.columns} data={currentTableConfig.data} enableExport={false} /></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10 text-center bg-slate-50/50">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><FileSearch size={32} className="text-slate-300" /></div>
              <h3 className="text-lg font-bold text-slate-600 mb-2">Área de Trabajo del Reporte</h3>
              <p className="text-sm text-slate-500">Configura tus filtros en la izquierda y presiona "Cargar Datos".</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .html2pdf__container .hide-in-pdf { display: none !important; }
        .html2pdf__container .show-in-pdf { display: block !important; }
        .html2pdf__container .pdf-hide-btn { display: none !important; }
      `}</style>
    </div>
  );
};

export default Reportes;