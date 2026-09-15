import React, { useState, useMemo } from "react";
import { 
  Search, Package, AlertTriangle, Clock, 
  CheckCircle2, ShieldAlert, MapPin, Settings2
} from "lucide-react";

import PageHeader from "../../shared/components/Layout/PageHeader";
import Table from "../../shared/components/Table/Table";
import type  { TableColumn }  from "../../shared/components/Table/Table";
// Asegúrate de que la ruta coincida con donde guardaste el nuevo componente
import KardexPanel from "./components/KardexPanel"; 

// ==========================================
// TIPOS Y DATOS SIMULADOS
// ==========================================
export type EstadoInventario = "Optimo" | "Bajo" | "Critico" | "Por Vencer";
export type Ubicacion = "Todas" | "Bodega Central" | "Farmacia" | "Quirófano";

export interface ProductoInventario {
  id: number;
  codigo: string;
  producto: string;
  categoria: string;
  stock: number;
  minimo: number;
  unidad: string;
  vencimiento: string;
  estado: EstadoInventario;
  ubicacion: Ubicacion;
}

const mockInventario: ProductoInventario[] = [
  { id: 1, codigo: "MED-001", producto: "Amoxicilina 500 mg", categoria: "Medicamentos", stock: 120, minimo: 30, unidad: "Cajas", vencimiento: "2027-10-15", estado: "Optimo", ubicacion: "Farmacia" },
  { id: 2, codigo: "MED-002", producto: "Doxiciclina 100 mg", categoria: "Medicamentos", stock: 15, minimo: 20, unidad: "Cajas", vencimiento: "2028-01-20", estado: "Bajo", ubicacion: "Bodega Central" },
  { id: 3, codigo: "MAT-015", producto: "Jeringas 5ml (Caja x100)", categoria: "Material Médico", stock: 3, minimo: 10, unidad: "Cajas", vencimiento: "2030-12-01", estado: "Critico", ubicacion: "Quirófano" },
  { id: 4, codigo: "MED-089", producto: "Ketamina 50 mg/ml", categoria: "Anestésicos", stock: 45, minimo: 15, unidad: "Frascos", vencimiento: "2026-10-05", estado: "Por Vencer", ubicacion: "Quirófano" },
  { id: 5, codigo: "MED-045", producto: "Ibuprofeno 400 mg", categoria: "Medicamentos", stock: 250, minimo: 50, unidad: "Cajas", vencimiento: "2029-05-11", estado: "Optimo", ubicacion: "Bodega Central" },
  { id: 6, codigo: "MAT-022", producto: "Guantes de Látex (Talla M)", categoria: "Material Médico", stock: 8, minimo: 20, unidad: "Cajas", vencimiento: "2028-08-30", estado: "Bajo", ubicacion: "Farmacia" },
  { id: 7, codigo: "MED-112", producto: "Vacuna Antirrábica", categoria: "Biológicos", stock: 12, minimo: 15, unidad: "Dosis", vencimiento: "2026-09-28", estado: "Por Vencer", ubicacion: "Farmacia" },
];

type SortOption = "nombre_asc" | "nombre_desc" | "stock_asc" | "stock_desc" | "vencimiento_asc";

const Inventario: React.FC = () => {
  // ==========================================
  // ESTADOS PRINCIPALES
  // ==========================================
  const [activeTab, setActiveTab] = useState<EstadoInventario | "Todos">("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("Todas");
  const [ubicacionFilter, setUbicacionFilter] = useState<Ubicacion>("Todas");
  const [sortBy, setSortBy] = useState<SortOption>("nombre_asc");
  
  // Estado para el panel de Kardex
  const [selectedProduct, setSelectedProduct] = useState<ProductoInventario | null>(null);

  // ==========================================
  // LÓGICA DE FILTRADO Y ORDENAMIENTO
  // ==========================================
  const processedData = useMemo(() => {
    let filtered = mockInventario.filter(item => {
      const matchesUbicacion = ubicacionFilter === "Todas" || item.ubicacion === ubicacionFilter;
      const matchesTab = activeTab === "Todos" || item.estado === activeTab;
      const matchesCategoria = categoriaFilter === "Todas" || item.categoria === categoriaFilter;
      const matchesSearch = item.producto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesUbicacion && matchesTab && matchesCategoria && matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "nombre_asc": return a.producto.localeCompare(b.producto);
        case "nombre_desc": return b.producto.localeCompare(a.producto);
        case "stock_asc": return a.stock - b.stock;
        case "stock_desc": return b.stock - a.stock;
        case "vencimiento_asc": return new Date(a.vencimiento).getTime() - new Date(b.vencimiento).getTime();
        default: return 0;
      }
    });

    return filtered;
  }, [ubicacionFilter, activeTab, searchTerm, categoriaFilter, sortBy]);

  // Conteo de KPIs dinámico según ubicación filtrada en la tabla
  const currentAreaStats = ubicacionFilter === "Todas" ? mockInventario : mockInventario.filter(i => i.ubicacion === ubicacionFilter);
  const counts = {
    Total: currentAreaStats.length,
    Optimo: currentAreaStats.filter(i => i.estado === "Optimo").length,
    BajoCritico: currentAreaStats.filter(i => i.estado === "Bajo" || i.estado === "Critico").length,
    PorVencer: currentAreaStats.filter(i => i.estado === "Por Vencer").length,
  };

  // ==========================================
  // DEFINICIÓN MAESTRA DE COLUMNAS
  // ==========================================
  const columns: TableColumn[] = [
    { id: "codigo", label: "Código", render: (row: ProductoInventario) => <span className="font-mono text-xs font-semibold text-slate-500">{row.codigo}</span> },
    { id: "producto", label: "Producto", render: (row: ProductoInventario) => <span className="font-bold text-[#304a6d]">{row.producto}</span> },
    { id: "categoria", label: "Categoría", render: (row: ProductoInventario) => <span className="text-slate-600 font-medium text-sm">{row.categoria}</span> },
    { 
      id: "stock", label: "Stock", 
      render: (row: ProductoInventario) => (
        <span className={`font-bold text-sm ${row.stock <= row.minimo ? 'text-rose-600' : 'text-slate-700'}`}>
          {row.stock} <span className="text-xs font-normal text-slate-500">{row.unidad}</span>
        </span>
      )
    },
    { 
      id: "ubicacion", label: "Ubicación", 
      render: (row: ProductoInventario) => (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <MapPin size={12} className="text-sky-500" /> {row.ubicacion}
        </span>
      )
    },
    { 
      id: "vencimiento", label: "Vencimiento", 
      render: (row: ProductoInventario) => (
        <span className={`text-sm ${row.estado === 'Por Vencer' ? 'text-orange-600 font-bold' : 'text-slate-600'}`}>
          {new Date(row.vencimiento).toLocaleDateString('es-NI', { year: 'numeric', month: 'short', day: '2-digit' })}
        </span>
      )
    },
    { 
      id: "estado", label: "Estado", 
      render: (row: ProductoInventario) => {
        switch (row.estado) {
          case "Optimo": return <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md uppercase tracking-wider">Óptimo</span>;
          case "Bajo": return <span className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md uppercase tracking-wider">Stock Bajo</span>;
          case "Critico": return <span className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-md uppercase tracking-wider flex items-center gap-1 w-fit"><ShieldAlert size={12}/> Crítico</span>;
          case "Por Vencer": return <span className="px-2.5 py-1 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-md uppercase tracking-wider flex items-center gap-1 w-fit"><Clock size={12}/> Por Vencer</span>;
          default: return <span>{row.estado}</span>;
        }
      }
    }
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-5 h-[calc(100vh-2rem)] pb-4 relative">
      
      {/* CABECERA */}
      <PageHeader 
        header="Inventario General" 
        sub="Supervisa existencias, identifica alertas de stock y gestiona los insumos." 
      />

      {/* TARJETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        <button onClick={() => setActiveTab("Todos")} className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeTab === "Todos" ? "border-sky-500 ring-1 ring-sky-500 shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]"}`}>
          <div className="flex justify-between items-start w-full">
            <span className="text-[13px] font-medium text-slate-600">Total Referencias</span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Package size={14} /></div>
          </div>
          <span className="text-3xl font-bold text-[#1e293b] mt-3 mb-3">{counts.Total}</span>
        </button>

        <button onClick={() => setActiveTab("Optimo")} className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeTab === "Optimo" ? "border-sky-500 ring-1 ring-sky-500 shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]"}`}>
          <div className="flex justify-between items-start w-full">
            <span className="text-[13px] font-medium text-slate-600">Stock Óptimo</span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><CheckCircle2 size={14} /></div>
          </div>
          <span className="text-3xl font-bold text-[#1e293b] mt-3 mb-3">{counts.Optimo}</span>
        </button>

        <button onClick={() => setActiveTab(activeTab === "Bajo" ? "Todos" : "Bajo")} className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${(activeTab === "Bajo" || activeTab === "Critico") ? "border-sky-500 ring-1 ring-sky-500 shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]"}`}>
          <div className="flex justify-between items-start w-full">
            <span className="text-[13px] font-medium text-slate-600">Alertas de Stock</span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><AlertTriangle size={14} /></div>
          </div>
          <span className="text-3xl font-bold text-[#1e293b] mt-3 mb-3">{counts.BajoCritico}</span>
        </button>

        <button onClick={() => setActiveTab("Por Vencer")} className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeTab === "Por Vencer" ? "border-sky-500 ring-1 ring-sky-500 shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]"}`}>
          <div className="flex justify-between items-start w-full">
            <span className="text-[13px] font-medium text-slate-600">Próximos a Vencer</span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Clock size={14} /></div>
          </div>
          <span className="text-3xl font-bold text-[#1e293b] mt-3 mb-3">{counts.PorVencer}</span>
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL: TABLA Y DRAWER */}
      <div className="flex-1 flex gap-4 min-h-0 w-full overflow-hidden">
        
        {/* PANEL DE LA TABLA */}
        <div className="flex-1 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col min-h-0 min-w-0 transition-all duration-300">
          
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 flex-shrink-0">
            
            <div className="relative w-full xl:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" placeholder="Buscar por código o nombre..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              
              {/* FILTRO UBICACIÓN */}
              <select 
                value={ubicacionFilter} onChange={(e) => setUbicacionFilter(e.target.value as Ubicacion)}
                className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-sky-500"
              >
                <option value="Todas">Ubicación: Todas</option>
                <option value="Bodega Central">Bodega Central</option>
                <option value="Farmacia">Farmacia</option>
                <option value="Quirófano">Quirófano</option>
              </select>

              {/* FILTRO CATEGORÍA */}
              <select 
                value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-sky-500"
              >
                <option value="Todas">Categoría: Todas</option>
                <option value="Medicamentos">Medicamentos</option>
                <option value="Material Médico">Material Médico</option>
                <option value="Anestésicos">Anestésicos</option>
              </select>

              {/* ORDENAMIENTO */}
              <select 
                value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 outline-none cursor-pointer focus:border-sky-500"
              >
                <option value="nombre_asc">Ordenar: A - Z</option>
                <option value="stock_desc">Mayor Stock</option>
                <option value="stock_asc">Menor Stock</option>
              </select>

              {/* BOTÓN DE AJUSTE (ADMIN) */}
              <button className="flex items-center gap-2 bg-[#304a6d] hover:bg-[#233854] text-white border border-transparent px-4 py-2 rounded-lg text-sm font-bold transition-all ml-auto xl:ml-2 shadow-sm">
                <Settings2 size={16} /> Ajuste 
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 p-2">
            <Table 
              columns={columns} 
              data={processedData} 
              enableExport={true}
              exportTitle={`Inventario General`}
              // Al hacer clic en el ojito en la tabla, pasamos el producto al KardexPanel
              onView={(row) => setSelectedProduct(row)}
            />
          </div>
        </div>

        {/* ========================================== */}
        {/* COMPONENTE KARDEX (Drawer Lateral / Modal) */}
        {/* ========================================== */}
        <KardexPanel 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />

      </div>
    </div>
  );
};

export default Inventario;