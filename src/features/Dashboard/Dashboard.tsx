import React, { useState } from "react";
import { 
  Package, AlertTriangle, Clock, TrendingUp, 
  RefreshCw, Calendar, Building2, Layers, ArrowDownToLine
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell // Nuevos componentes para la gráfica de Dono
} from 'recharts';

import PageHeader from "../../shared/components/Layout/PageHeader";
import Table from "../../shared/components/Table/Table";
import type { TableColumn } from "../../shared/components/Table/Table";


const BASE_CATEGORIAS = [
  { categoria: 'Antibióticos', entradas: 450, salidas: 380 },
  { categoria: 'Analgésicos', entradas: 320, salidas: 290 },
  { categoria: 'Mat. Quirúrgico', entradas: 250, salidas: 210 },
  { categoria: 'Vitaminas', entradas: 210, salidas: 180 },
  { categoria: 'Vacunas', entradas: 150, salidas: 145 },
];

// Nueva base de datos: Distribución por Acción Terapéutica
const BASE_TERAPEUTICA = [
  { accion: 'Antibióticos', cantidad: 4500 },
  { accion: 'Desparasitantes', cantidad: 3200 },
  { accion: 'Anestésicos', cantidad: 1800 },
  { accion: 'Antiinflamatorios', cantidad: 1500 },
  { accion: 'Vitaminas/Supl.', cantidad: 950 },
];

// Paleta de colores corporativa (Degradado de Azul a Slate) para la gráfica circular
const COLORS_TERAPEUTICA = ['#304a6d', '#3b82f6', '#64748b', '#94a3b8', '#cbd5e1'];

const Dashboard: React.FC = () => {
  // ==========================================
  // ESTADOS DE FILTROS SUPERIORES
  // ==========================================
  const [dateFilter, setDateFilter] = useState("30");
  const [fechaInicio, setFechaInicio] = useState("2026-08-14");
  const [fechaFin, setFechaFin] = useState("2026-09-14");
  
  const [bodega, setBodega] = useState("todas");
  const [categoria, setCategoria] = useState("todas");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ==========================================
  // ESTADOS REACTIVOS (Gráficas y KPIs)
  // ==========================================
  const [catData, setCatData] = useState([...BASE_CATEGORIAS]);
  const [terapeuticaData, setTerapeuticaData] = useState([...BASE_TERAPEUTICA]);
  
  const [kpis, setKpis] = useState({
    totalSku: 482,
    ingresos: 1580,
    alertas: 12,
    vencimientos: 8
  });

  // ==========================================
  // LÓGICA DE ACTUALIZACIÓN (SIMULADOR)
  // ==========================================
  const handleRecargar = () => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      let multiplicador = 1;
      if (bodega === "central") multiplicador = 1.3;
      else if (bodega === "clinica") multiplicador = 0.6;

      if (categoria === "medicamentos") multiplicador *= 1.2;
      else if (categoria === "materiales") multiplicador *= 0.7;

      const nuevasCategorias = BASE_CATEGORIAS.map(d => ({
        categoria: d.categoria,
        entradas: Math.floor((d.entradas * multiplicador) + (Math.random() * 50)),
        salidas: Math.floor((d.salidas * multiplicador) + (Math.random() * 50))
      }));

      // Variación simulada para el gráfico de acción terapéutica
      const nuevasTerapeuticas = BASE_TERAPEUTICA.map(d => ({
        accion: d.accion,
        cantidad: Math.floor((d.cantidad * multiplicador) + (Math.random() * 200))
      })).sort((a, b) => b.cantidad - a.cantidad); // Ordenamos para que el gráfico quede estético

      setKpis({
        totalSku: Math.floor(482 * (categoria !== "todas" ? 0.5 : 1)), 
        ingresos: Math.floor(1580 * multiplicador),
        alertas: Math.floor(12 * multiplicador * (Math.random() + 0.5)),
        vencimientos: Math.floor(8 * multiplicador * (Math.random() + 0.5))
      });

      setCatData(nuevasCategorias);
      setTerapeuticaData(nuevasTerapeuticas);
      setIsRefreshing(false);
      
    }, 800); 
  };

  // ==========================================
  // DATOS FIJOS PARA TABLAS INFERIORES
  // ==========================================
  const stockBajoColumns: TableColumn[] = [
    { id: "codigo", label: "Código" },
    { id: "medicamento", label: "Producto" },
    { id: "stock_actual", label: "Stock actual", render: (row) => <span className="font-bold text-slate-700">{row.stock_actual}</span> },
    { id: "minimo", label: "Mínimo", render: (row) => <span className="text-slate-500">{row.minimo}</span> },
    { 
      id: "estado", label: "Estado",
      render: () => <span className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-md uppercase tracking-wider">Crítico</span>
    }
  ];

  const proximosVencerColumns: TableColumn[] = [
    { id: "medicamento", label: "Producto" },
    { id: "lote", label: "Lote", render: (row) => <span className="font-mono text-xs text-slate-500">{row.lote}</span> },
    { id: "vencimiento", label: "Vencimiento", render: (row) => <span className="text-sm text-slate-700 font-medium">{row.vencimiento}</span> },
    { id: "dias", label: "Alerta", render: (row) => <span className="text-amber-600 text-xs font-bold">En {row.dias} días</span> },
  ];

  const stockBajoData = [
    { id: 1, codigo: "MED-012", medicamento: "Amoxicilina 500 mg", stock_actual: 4, minimo: 20 },
    { id: 2, codigo: "MED-045", medicamento: "Ibuprofeno 400 mg", stock_actual: 2, minimo: 15 },
    { id: 3, codigo: "MED-089", medicamento: "Oxitetraciclina 20%", stock_actual: 1, minimo: 10 },
  ];

  const proximosVencerData = [
    { id: 1, medicamento: "Amoxicilina 500 mg", lote: "L-458752", vencimiento: "Oct 2026", dias: 15 },
    { id: 2, medicamento: "Midazolam 5mg", lote: "L-998120", vencimiento: "Oct 2026", dias: 22 },
    { id: 3, medicamento: "Prednisona 50mg", lote: "L-112344", vencimiento: "Nov 2026", dias: 45 },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 pb-10">
      
      {/* CABECERA */}
      <PageHeader 
        header="Dashboard de Inventario" 
        sub="Monitoreo en tiempo real de existencias, flujo de suministros y alertas tempranas." 
      />

      {/* BARRA DE FILTROS SUPERIOR */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm transition-all">
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
              <option value="central">Bodega Central UNA</option>
              <option value="clinica">Clínica Veterinaria</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 px-3 py-2 rounded-xl text-sm">
            <Layers size={16} className="text-[#304a6d]" />
            <select 
              value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="bg-transparent outline-none cursor-pointer font-medium text-xs text-slate-700"
            >
              <option value="todas">Todos los insumos</option>
              <option value="medicamentos">Medicamentos</option>
              <option value="materiales">Material Médico</option>
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

      {/* TARJETAS DE RESUMEN (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between hover:border-slate-300 transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Productos (SKU)</span>
            <div className="w-10 h-10 bg-slate-50 text-[#304a6d] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Package size={20} /></div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-slate-800">{kpis.totalSku}</h2>
            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1"><TrendingUp size={14} /> Activos en catálogo</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between hover:border-slate-300 transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos Acumulados</span>
            <div className="w-10 h-10 bg-slate-50 text-[#304a6d] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><ArrowDownToLine size={20} /></div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-slate-800">{kpis.ingresos.toLocaleString()} <span className="text-sm font-medium text-slate-400">Unds</span></h2>
            <p className="text-xs text-slate-500 font-medium mt-2">En el periodo seleccionado</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between hover:border-rose-200 transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alertas de Stock Bajo</span>
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><AlertTriangle size={20} /></div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-rose-600">{kpis.alertas}</h2>
            <p className="text-xs text-rose-600 font-semibold mt-2 flex items-center gap-1">Requieren compra urgente</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between hover:border-amber-200 transition-colors group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Próximos a Vencer</span>
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Clock size={20} /></div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-amber-600">{kpis.vencimientos}</h2>
            <p className="text-xs text-amber-600 font-semibold mt-2">Lotes vencen en &lt; 90 días</p>
          </div>
        </div>
      </div>

      {/* ZONA DE GRÁFICAS */}
      {/* Usamos grid-cols-10 para crear la proporción exacta 70% (col-span-7) y 30% (col-span-3) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* GRÁFICA 1: EJE Y CATEGORÍAS (70% del ancho -> col-span-7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col">
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#304a6d]">Flujo por Categorías</h3>
            <p className="text-xs text-slate-400 mt-1">Comparativa directa de Entradas vs Salidas agrupado por familia.</p>
          </div>
          
          <div className="flex-1 w-full min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={catData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis dataKey="categoria" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                
                <Bar dataKey="entradas" name="Total Entradas" fill="#304a6d" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="salidas" name="Total Salidas" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICA 2: DONUT CHART (30% del ancho -> col-span-3) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col">
          <div className="mb-2">
            <h3 className="text-base font-bold text-[#304a6d]">Acción Terapéutica</h3>
            <p className="text-xs text-slate-400 mt-1">Distribución del inventario.</p>
          </div>
          
          <div className="flex-1 w-full min-h-[320px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={terapeuticaData}
                  cx="50%" // Centrado exacto
                  cy="45%" // Un poco hacia arriba para hacer espacio a la leyenda abajo
                  innerRadius={75} 
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="cantidad"
                  nameKey="accion"
                  stroke="none"
                >
                  {terapeuticaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_TERAPEUTICA[index % COLORS_TERAPEUTICA.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => {
                    const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
                    return [`${formattedValue} Unds`, 'Stock Actual'];
                  }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#304a6d' }}
                />
                {/* Pasamos la leyenda a la parte inferior para que se acomode al 30% del ancho */}
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11.5px', color: '#475569', fontWeight: 500, paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Texto centrado del dono */}
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
              <span className="block text-xl font-black text-[#304a6d]">
                {terapeuticaData.reduce((acc, curr) => acc + curr.cantidad, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* TABLAS INFERIORES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="flex flex-col bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={16} /> Alertas de Stock Crítico</h3>
            </div>
            <button className="text-xs font-bold text-[#304a6d] hover:bg-slate-50 px-4 py-2 rounded-lg border border-transparent hover:border-slate-200 transition-all">Ver reporte</button>
          </div>
          <div className="flex-1 flex flex-col min-h-[220px]">
            <Table columns={stockBajoColumns} data={stockBajoData} enableExport={false} />
          </div>
        </div>

        <div className="flex flex-col bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2"><Clock size={16} /> Próximos Vencimientos</h3>
            </div>
            <button className="text-xs font-bold text-[#304a6d] hover:bg-slate-50 px-4 py-2 rounded-lg border border-transparent hover:border-slate-200 transition-all">Ver reporte</button>
          </div>
          <div className="flex-1 flex flex-col min-h-[220px]">
            <Table columns={proximosVencerColumns} data={proximosVencerData} enableExport={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;