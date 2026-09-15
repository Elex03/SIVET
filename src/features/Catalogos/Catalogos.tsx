import React, { useState } from "react";
import { 
  Search, Plus, Pill, Activity, Bookmark, Layers
} from "lucide-react";

import PageHeader from "../../shared/components/Layout/PageHeader";
import Table from "../../shared/components/Table/Table";
import type { TableColumn } from "../../shared/components/Table/Table";

// Importamos los 4 modales
import ModalMedicamento from "./components/ModalMedicamento"; 
import ModalTerapeutica from "./components/ModalTerapeutica";
import ModalMarca from "./components/ModalMarca";
import ModalCategoria from "./components/ModalCategoria";

type CatalogoType = "medicamentos" | "terapeuticas" | "marcas" | "categorias";

const Catalogos: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CatalogoType>("medicamentos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==========================================
  // COLUMNAS Y DATOS (Resumido para el ejemplo)
  // ==========================================
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
  const medicamentosData = [{ id: 1, codigo: "MED-001", nombre: "Amoxicilina 500 mg", accion: "Antibiótico", marca: "Genfar", activo: true }];

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
  const terapeuticasData = [{ id: 1, nombre: "Antibiótico", descripcion: "Tratamiento bacteriano.", total_meds: 45, activo: true }];

  const getActiveCatalogData = () => {
    switch (activeTab) {
      case "medicamentos":
        return { title: "Catálogo de Medicamentos", subtitle: "Gestión de todos los productos.", cols: medicamentosCols, data: medicamentosData };
      case "terapeuticas":
        return { title: "Acciones Terapéuticas", subtitle: "Clasificación farmacológica.", cols: terapeuticasCols, data: terapeuticasData };
      case "marcas":
        return { title: "Marcas y Laboratorios", subtitle: "Proveedores y fabricantes autorizados.", cols: terapeuticasCols, data: [] }; // Puedes poner tus columnas reales aquí
      case "categorias":
        return { title: "Categorías de Insumos", subtitle: "Familias generales.", cols: terapeuticasCols, data: [] }; // Y aquí
      default:
        return { title: "", subtitle: "", cols: [], data: [] };
    }
  };

  const currentCatalog = getActiveCatalogData();

  const filteredData = currentCatalog.data.filter((item) => 
    Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 pb-10 h-full relative">
      <PageHeader header="Catálogos del Sistema" sub="Administración centralizada de maestros, medicamentos y clasificaciones." />

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* NAVEGACIÓN IZQUIERDA */}
        <div className="w-full lg:w-[260px] flex-shrink-0 bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Maestros</h3>
          <nav className="flex flex-col gap-1.5">
            <button onClick={() => setActiveTab("medicamentos")} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "medicamentos" ? "bg-blue-50 text-[#3b82f6]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <Pill size={18} className={activeTab === "medicamentos" ? "text-[#3b82f6]" : "text-slate-400"} /> Medicamentos
            </button>
            <button onClick={() => setActiveTab("terapeuticas")} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "terapeuticas" ? "bg-blue-50 text-[#3b82f6]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <Activity size={18} className={activeTab === "terapeuticas" ? "text-[#3b82f6]" : "text-slate-400"} /> Acción Terapéutica
            </button>
            <button onClick={() => setActiveTab("marcas")} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "marcas" ? "bg-blue-50 text-[#3b82f6]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <Bookmark size={18} className={activeTab === "marcas" ? "text-[#3b82f6]" : "text-slate-400"} /> Marcas / Laboratorios
            </button>
            <button onClick={() => setActiveTab("categorias")} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "categorias" ? "bg-blue-50 text-[#3b82f6]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <Layers size={18} className={activeTab === "categorias" ? "text-[#3b82f6]" : "text-slate-400"} /> Categorías
            </button>
          </nav>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#304a6d]">{currentCatalog.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{currentCatalog.subtitle}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" placeholder="Buscar registro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#3b82f6] focus:bg-white transition-all"
                />
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#304a6d] hover:bg-[#233854] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Plus size={16} /> Nuevo Registro
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <Table 
              columns={currentCatalog.cols} 
              data={filteredData}
              enableExport={true}
              exportTitle={currentCatalog.title}
            />
          </div>
        </div>
      </div>

      {/* RENDERIZADO DINÁMICO DE MODALES */}
      {activeTab === "medicamentos" && <ModalMedicamento isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      {activeTab === "terapeuticas" && <ModalTerapeutica isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      {activeTab === "marcas" && <ModalMarca isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      {activeTab === "categorias" && <ModalCategoria isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
      
    </div>
  );
};

export default Catalogos;