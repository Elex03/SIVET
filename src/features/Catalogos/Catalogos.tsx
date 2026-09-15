import React, { useState } from "react";
import { 
  Search, Plus, Pill, Activity, Bookmark, 
  Layers
} from "lucide-react";

import PageHeader from "../../shared/components/Layout/PageHeader";
import Table from "../../shared/components/Table/Table";
import type { TableColumn } from "../../shared/components/Table/Table";

type CatalogoType = "medicamentos" | "terapeuticas" | "marcas" | "categorias";

const Catalogos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CatalogoType>("medicamentos");
  const [searchTerm, setSearchTerm] = useState("");

  const medicamentosCols: TableColumn[] = [
    { id: "codigo", label: "Código", render: (row) => <span className="font-mono text-xs text-slate-500">{row.codigo}</span> },
    { id: "nombre", label: "Medicamento", render: (row) => <span className="font-bold text-slate-800">{row.nombre}</span> },
    { id: "accion", label: "Acción Terapéutica" },
    { id: "marca", label: "Marca / Lab", render: (row) => <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-xs font-semibold">{row.marca}</span> },
    { id: "estado", label: "Estado", render: (row) => (
      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${row.activo ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
        {row.activo ? 'Activo' : 'Inactivo'}
      </span>
    )}
  ];

  const medicamentosData = [
    { id: 1, codigo: "MED-001", nombre: "Amoxicilina 500 mg", accion: "Antibiótico", marca: "Genfar", activo: true },
    { id: 2, codigo: "MED-002", nombre: "Doxiciclina 100 mg", accion: "Antibiótico", marca: "Biozoo", activo: true },
    { id: 3, codigo: "MED-003", nombre: "Ivermectina 1%", accion: "Desparasitante", marca: "Montana", activo: true },
    { id: 4, codigo: "MED-004", nombre: "Ketamina 50 mg/ml", accion: "Anestésico", marca: "Holliday", activo: false },
  ];

  // ==========================================
  // 2. COLUMNAS Y DATOS: ACCIONES TERAPÉUTICAS
  // ==========================================
  const terapeuticasCols: TableColumn[] = [
    { id: "nombre", label: "Acción Terapéutica", render: (row) => <span className="font-bold text-[#304a6d]">{row.nombre}</span> },
    { id: "descripcion", label: "Descripción / Uso principal" },
    { id: "total_meds", label: "Meds. Asociados", render: (row) => <span className="font-semibold text-slate-600">{row.total_meds}</span> },
    { id: "estado", label: "Estado", render: (row) => (
      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${row.activo ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
        {row.activo ? 'Activo' : 'Inactivo'}
      </span>
    )}
  ];

  const terapeuticasData = [
    { id: 1, nombre: "Antibiótico", descripcion: "Tratamiento de infecciones bacterianas.", total_meds: 45, activo: true },
    { id: 2, nombre: "Analgésico", descripcion: "Alivio del dolor sin pérdida de consciencia.", total_meds: 28, activo: true },
    { id: 3, nombre: "Anestésico", descripcion: "Pérdida temporal de sensibilidad/consciencia.", total_meds: 12, activo: true },
    { id: 4, nombre: "Desparasitante", descripcion: "Erradicación de parásitos internos o externos.", total_meds: 34, activo: true },
  ];

  // ==========================================
  // LÓGICA DE RENDERIZADO DINÁMICO
  // ==========================================
  const getActiveCatalogData = () => {
    switch (activeTab) {
      case "medicamentos":
        return { 
          title: "Catálogo de Medicamentos", 
          subtitle: "Gestión de todos los productos farmacológicos y sus presentaciones.",
          cols: medicamentosCols, 
          data: medicamentosData 
        };
      case "terapeuticas":
        return { 
          title: "Acciones Terapéuticas", 
          subtitle: "Clasificación farmacológica para organizar el inventario.",
          cols: terapeuticasCols, 
          data: terapeuticasData 
        };
      case "marcas":
        return { title: "Marcas y Laboratorios", subtitle: "Proveedores y fabricantes autorizados.", cols: [], data: [] };
      case "categorias":
        return { title: "Categorías de Insumos", subtitle: "Familias generales (Medicamentos, Quirúrgicos, etc).", cols: [], data: [] };
      default:
        return { title: "", subtitle: "", cols: [], data: [] };
    }
  };

  const currentCatalog = getActiveCatalogData();

  // Filtrado de búsqueda básico
  const filteredData = currentCatalog.data.filter((item) => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 pb-10 h-full">
      
      {/* CABECERA */}
      <PageHeader 
        header="Catálogos del Sistema" 
        sub="Administración centralizada de maestros, medicamentos y clasificaciones." 
      />

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* ========================================== */}
        {/* PANEL IZQUIERDO: MENÚ DE NAVEGACIÓN */}
        {/* ========================================== */}
        <div className="w-full lg:w-[260px] flex-shrink-0 bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Maestros</h3>
          
          <nav className="flex flex-col gap-1.5">
            <button 
              onClick={() => setActiveTab("medicamentos")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "medicamentos" 
                  ? "bg-blue-50 text-[#3b82f6]" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Pill size={18} className={activeTab === "medicamentos" ? "text-[#3b82f6]" : "text-slate-400"} />
              Medicamentos
            </button>
            
            <button 
              onClick={() => setActiveTab("terapeuticas")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "terapeuticas" 
                  ? "bg-blue-50 text-[#3b82f6]" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Activity size={18} className={activeTab === "terapeuticas" ? "text-[#3b82f6]" : "text-slate-400"} />
              Acción Terapéutica
            </button>

            <button 
              onClick={() => setActiveTab("marcas")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "marcas" 
                  ? "bg-blue-50 text-[#3b82f6]" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Bookmark size={18} className={activeTab === "marcas" ? "text-[#3b82f6]" : "text-slate-400"} />
              Marcas / Laboratorios
            </button>

            <button 
              onClick={() => setActiveTab("categorias")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "categorias" 
                  ? "bg-blue-50 text-[#3b82f6]" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Layers size={18} className={activeTab === "categorias" ? "text-[#3b82f6]" : "text-slate-400"} />
              Categorías
            </button>
          </nav>
        </div>

        {/* ========================================== */}
        {/* PANEL DERECHO: CONTENIDO Y TABLA */}
        {/* ========================================== */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Header del Catálogo Activo + Buscador y Botón */}
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#304a6d]">{currentCatalog.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{currentCatalog.subtitle}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Barra de búsqueda */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar registro..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#3b82f6] focus:bg-white transition-all"
                />
              </div>

              {/* Botón Nuevo */}
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#304a6d] hover:bg-[#233854] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md">
                <Plus size={16} />
                Nuevo Registro
              </button>
            </div>
          </div>

          {/* Tabla Dinámica (Reutilizando tu componente <Table />) */}
          <div className="flex-1 flex flex-col">
            <Table 
              columns={currentCatalog.cols} 
              data={filteredData}
              enableExport={true}
              exportTitle={currentCatalog.title}
              exportSubtitle={`Exportado desde el sistema SIVET`}
              onEdit={(row) => console.log("Editar", row)}
              onView={(row) => console.log("Ver detalles", row)}
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default Catalogos;