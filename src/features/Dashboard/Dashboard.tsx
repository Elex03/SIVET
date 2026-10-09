import MedicationImage from '../../shared/components/MedicationImage';
import StatCard from '../../shared/components/Layout/StatCard';
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../shared/api/useSivet';
import { today } from '../../shared/api/domain';
import { selectDashboard } from '../../shared/api/selectors';
import DataFeedback from '../../shared/components/Layout/DataFeedback';
import {
  Package, AlertTriangle, Clock,
  RefreshCw, Calendar, Building2, Layers, ArrowDownToLine
} from "lucide-react";
import { ReportChart } from '../Reportes/ReportChart';

import PageHeader from "../../shared/components/Layout/PageHeader";
import Table from "../../shared/components/Table/Table";
import type { TableColumn } from "../../shared/components/Table/Table";



const Dashboard: React.FC = () => {
  // ==========================================
  // ESTADOS DE FILTROS SUPERIORES
  // ==========================================
  const [dateFilter, setDateFilter] = useState("30");
  const [fechaInicio, setFechaInicio] = useState(today());
  const [fechaFin, setFechaFin] = useState(today());

  const [bodega, setBodega] = useState("todas");
  const [categoria, setCategoria] = useState("todas");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const state = useDashboard();
  const navigate = useNavigate();
  const { catData, terapeuticaData, areaData, kpis, stockBajoData, proximosVencerData } = selectDashboard(state.data, dateFilter, fechaInicio, fechaFin, bodega, categoria);
  const handleRecargar = async () => { setIsRefreshing(true); await state.refresh(); setIsRefreshing(false); };

  const stockBajoColumns: TableColumn[] = [
    { id: "codigo", label: "Código" },
    { id: "imagen", label: "Imagen", render: row => <MedicationImage src={row.imagen} name={row.medicamento} /> }, { id: "medicamento", label: "Producto" },
    { id: "stock_actual", label: "Stock actual", render: (row) => <span className="font-bold text-slate-700">{row.stock_actual}</span> },
    { id: "minimo", label: "Mínimo", render: (row) => <span className="text-slate-500">{row.minimo}</span> },
    {
      id: "estado", label: "Estado",
      render: () => <span className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-md uppercase tracking-wider">Crítico</span>
    }
  ];

  const proximosVencerColumns: TableColumn[] = [
    { id: "imagen", label: "Imagen", render: row => <MedicationImage src={row.imagen} name={row.medicamento} /> }, { id: "medicamento", label: "Producto" },
    { id: "lote", label: "Lote", render: (row) => <span className="font-mono text-xs text-slate-500">{row.lote}</span> },
    { id: "vencimiento", label: "Vencimiento", render: (row) => <span className="text-sm text-slate-700 font-medium">{row.vencimiento}</span> },
    { id: "dias", label: "Alerta", render: (row) => <span className="text-amber-600 text-xs font-bold">{row.dias <= 0 ? "Vencido" : `En ${row.dias} días`}</span> },
  ];

  return (
    <div className="screen-page w-full max-w-[1600px] mx-auto flex flex-col gap-6 pb-10">

      {/* CABECERA */}
      <PageHeader
        header="Dashboard de Inventario"
        sub="Existencias actuales y movimientos registrados en el período seleccionado."
      />

      <DataFeedback {...state} /><div className="activity-layout dashboard-without-activity"><div className="activity-content" tabIndex={0} role="region" aria-label="Contenido de la pantalla">
      {dateFilter === "custom" && fechaInicio > fechaFin && <p role="alert" className="text-rose-600">La fecha inicial debe ser anterior a la final.</p>}
      {/* BARRA DE FILTROS SUPERIOR */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">

          <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm transition-all">
            <Calendar size={16} className="text-[#304a6d]" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent outline-none cursor-pointer font-medium text-xs text-slate-700"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Último Trimestre</option>
              <option value="custom">Personalizado...</option>
            </select>

            {dateFilter === "custom" && (
              <div className="flex items-center gap-1.5 ml-1 pl-3 border-l border-slate-200 animate-in fade-in slide-in-from-left-2 duration-200">
                <input
                  type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer font-medium text-xs text-slate-700 w-[105px]"
                />
                <span className="text-slate-400 text-xs font-semibold">a</span>
                <input
                  type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer font-medium text-xs text-slate-700 w-[105px]"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 px-3 py-2 rounded-xl text-sm">
            <Building2 size={16} className="text-[#304a6d]" />
            <select
              value={bodega} onChange={(e) => setBodega(e.target.value)}
              className="bg-transparent outline-none cursor-pointer font-medium text-xs text-slate-700"
            >
              <option value="todas">Todas las bodegas</option>
              <option value="Bodega Central">Bodega Central UNA</option>
              <option value="Farmacia">Farmacia</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 px-3 py-2 rounded-xl text-sm">
            <Layers size={16} className="text-[#304a6d]" />
            <select
              value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="bg-transparent outline-none cursor-pointer font-medium text-xs text-slate-700"
            >
              <option value="todas">Todos los insumos</option>
              {[...new Set(state.data.catalogos.filter(p => p.tipo === 'medicamentos').map(p => p.categoria).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleRecargar}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 bg-[#304a6d] hover:bg-[#233854] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-70 w-full xl:w-auto"
        >
          <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total productos (SKU)" value={kpis.totalSku} icon={Package} tone="blue" detail="Medicamentos activos en el catálogo seleccionado" />
        <StatCard title="Ingresos acumulados" value={kpis.ingresos} icon={ArrowDownToLine} tone="emerald" previous={kpis.previousIngresos} comparisonLabel="vs. período anterior" detail="Unidades ingresadas en el período y filtros seleccionados" />
        <StatCard title="Alertas de stock bajo" value={kpis.alertas} icon={AlertTriangle} tone="rose" detail="Medicamentos por debajo del mínimo; requieren reposición" />
        <StatCard title="Próximos a vencer" value={kpis.vencimientos} icon={Clock} tone="amber" detail="Lotes con existencias que vencen en 90 días o ya vencieron" />
      </div>

      <div className="@container/dashboard w-full min-w-0">
        <div className="grid grid-cols-1 @[950px]/dashboard:grid-cols-5 gap-5 items-stretch">
          <section className="@[950px]/dashboard:col-span-3 min-w-0 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-[#304a6d]"><Layers size={18} className="inline mr-2 text-blue-500" />Flujo por Categorías</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">Entradas y salidas finales por familia.</p>
            <ReportChart report="existencias" metric="flujo" type="bar" data={catData.map(d => ({ ...d, name: d.categoria }))} />
          </section>
          <section className="@[950px]/dashboard:col-span-2 min-w-0 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-[#304a6d]"><Package size={18} className="inline mr-2 text-blue-500" />Acción Terapéutica</h3>
            <p className="text-xs text-slate-500 mt-1 mb-3">Distribución del inventario · {terapeuticaData.reduce((n, d) => n + d.cantidad, 0).toLocaleString('es-NI')} unidades registradas</p>
            <ReportChart report="existencias" metric="cantidad" type="pie" data={terapeuticaData.map(d => ({ ...d, name: d.accion }))} />
          </section>
        </div>
      </div>
      <section className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 min-w-0">
        <div className="flex flex-wrap gap-3 justify-between"><h3 className="font-bold text-[#304a6d]"><ArrowDownToLine size={18} className="inline mr-2 text-blue-500" />Salida de productos por área</h3><button className="text-sm text-[#304a6d] font-bold" onClick={() => navigate('/reportes?tipo=salidas_area')}>Ver reporte →</button></div>
        <p className="text-xs text-slate-500 mt-1 mb-4">Despachos finales del período, ordenados de mayor a menor. Se suman cantidades en la unidad de cada producto; los traslados internos no se cuentan.</p>
        {!!areaData.length && <p className="text-sm text-[#304a6d] mb-4">Mayor salida: <strong>{areaData[0].area}</strong> · {areaData[0].total} unidades registradas</p>}
        <ReportChart report="salidas_area" metric="total" type="bar" data={areaData.map(d => ({ ...d, name: d.area }))} />
        <Table columns={[{ id: 'area', label: 'Área' }, { id: 'total', label: 'Total' }]} data={areaData.map(a => ({ ...a, id: a.area }))} exportTitle="Salidas por área" />
      </section>
      {/* TABLAS INFERIORES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="flex flex-col bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={16} /> Alertas de Stock Crítico</h3>
            </div>
            <button onClick={() => navigate("/reportes?tipo=bajo_stock")} className="text-xs font-bold text-[#304a6d] hover:bg-slate-50 px-4 py-2 rounded-lg border border-transparent hover:border-slate-200 transition-all">Ver reporte</button>
          </div>
          <div className="flex-1 flex flex-col min-h-[220px]">
            <Table pageSize={8} columns={stockBajoColumns} data={stockBajoData} enableExport={false} />
          </div>
        </div>

        <div className="flex flex-col bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2"><Clock size={16} /> Próximos Vencimientos</h3>
            </div>
            <button onClick={() => navigate("/reportes?tipo=vencimientos")} className="text-xs font-bold text-[#304a6d] hover:bg-slate-50 px-4 py-2 rounded-lg border border-transparent hover:border-slate-200 transition-all">Ver reporte</button>
          </div>
          <div className="flex-1 flex flex-col min-h-[220px]">
            <Table pageSize={8} columns={proximosVencerColumns} data={proximosVencerData} enableExport={false} />
          </div>
        </div>
      </div>
      
    </div></div></div>
  );
};

export default Dashboard;
