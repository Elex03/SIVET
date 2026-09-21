import React, { useState } from "react";
import { Search, Eye, Package, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import PageHeader from "../../../shared/components/Layout/PageHeader";
import Table from "../../../shared/components/Table/Table";
import type  { TableColumn } from "../../../shared/components/Table/Table";
import ModalSolicitud from "../components/ModalSolicitud"; 

const initialData = [
  {
    id: "SOL-2609-012", farmacia: "Farmacia Central", solicitante: "Dra. Ana López", fecha: "2026-09-20T08:30:00", prioridad: "URGENTE", estado: "PENDIENTE",
    items: [
      { id: 1, codigo: "MED-089", producto: "Ketamina 50 mg/ml", cantidad: 5, unidad: "FRASCOS", stock_disponible: 0 }, // Falla a propósito
      { id: 2, codigo: "MAT-015", producto: "Jeringas 5ml (Caja x100)", cantidad: 2, unidad: "CAJAS", stock_disponible: 0 } // Falla a propósito
    ]
  },
  {
    id: "SOL-2609-011", farmacia: "Quirófano 1", solicitante: "Dr. Carlos V.", fecha: "2026-09-20T09:15:00", prioridad: "ALTA", estado: "EN PREPARACION",
    items: [
      { id: 3, codigo: "MAT-022", producto: "Guantes de Látex", cantidad: 10, unidad: "CAJAS", stock_disponible: 50 }
    ]
  },
  {
    id: "SOL-2609-010", farmacia: "Clínica Menor", solicitante: "Est. María F.", fecha: "2026-09-19T16:45:00", prioridad: "NORMAL", estado: "LISTO PARA ENTREGA",
    items: [
      { id: 5, codigo: "MED-112", producto: "Vacuna Antirrábica", cantidad: 15, unidad: "DOSIS", stock_disponible: 20 }
    ]
  }
];

const SolicitudesBodega: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("TODOS");
  const [selectedSolicitud, setSelectedSolicitud] = useState<any | null>(null);

  const counts = {
    Total: solicitudes.length,
    Pendientes: solicitudes.filter(s => s.estado === "PENDIENTE").length,
    Preparacion: solicitudes.filter(s => s.estado === "EN PREPARACION").length,
    Listas: solicitudes.filter(s => s.estado === "LISTO PARA ENTREGA").length,
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setSolicitudes(prev => prev.map(sol => sol.id === id ? { ...sol, estado: newStatus } : sol));
    setSelectedSolicitud((prev: any) => prev?.id === id ? { ...prev, estado: newStatus } : prev);
  };

  const filteredData = solicitudes.filter(sol => {
    const matchesSearch = sol.farmacia.toLowerCase().includes(searchTerm.toLowerCase()) || sol.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "TODOS" || sol.estado === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const columns: TableColumn[] = [
    { id: "id", label: "Documento", render: (row) => <span className="font-mono text-sm font-bold text-[#304a6d]">{row.id}</span> },
    { 
      id: "origen", label: "Área / Solicitante", 
      render: (row) => (
        <div>
          <span className="block text-sm font-bold text-slate-700">{row.farmacia}</span>
          <span className="block text-xs font-medium text-slate-500">{row.solicitante}</span>
        </div>
      )
    },
    { 
      id: "fecha", label: "Fecha", 
      render: (row) => <span className="text-sm text-slate-600">{new Date(row.fecha).toLocaleDateString()}</span>
    },
    { 
      id: "estado", label: "Estado", 
      render: (row) => {
        switch (row.estado) {
          case "PENDIENTE": return <span className="px-2.5 py-1 text-[11px] font-bold text-amber-600 bg-white border border-amber-200 rounded uppercase tracking-wider">Pendiente</span>;
          case "EN PREPARACION": return <span className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-white border border-blue-200 rounded uppercase tracking-wider">En Preparación</span>;
          case "LISTO PARA ENTREGA": return <span className="px-2.5 py-1 text-[11px] font-bold text-purple-600 bg-white border border-purple-200 rounded uppercase tracking-wider">Listo</span>;
          case "COMPLETADO": return <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 bg-white border border-emerald-200 rounded uppercase tracking-wider">Completado</span>;
          default: return <span>{row.estado}</span>;
        }
      }
    },
    { 
      id: "prioridad", label: "Prioridad", 
      render: (row) => {
        switch (row.prioridad) {
          case "URGENTE": return <span className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50/50 border border-rose-200 rounded uppercase tracking-wider">Urgente</span>;
          case "ALTA": return <span className="px-2.5 py-1 text-[11px] font-bold text-orange-600 bg-orange-50/50 border border-orange-200 rounded uppercase tracking-wider">Alta</span>;
          case "NORMAL": return <span className="px-2.5 py-1 text-[11px] font-bold text-sky-600 bg-sky-50/50 border border-sky-200 rounded uppercase tracking-wider">Normal</span>;
          default: return <span>{row.prioridad}</span>;
        }
      }
    }
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-5 h-[calc(100vh-2rem)] pb-4 relative bg-slate-50/50">
      <PageHeader header="Solicitudes a Bodega" sub="Revisión y autorización de pedidos internos." />

      {/* TARJETAS BLANCAS (Clon de la imagen de referencia) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        
        <button onClick={() => setActiveFilter("TODOS")} className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeFilter === "TODOS" ? "border-sky-500 ring-1 ring-sky-500 shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-sm"}`}>
          <div className="flex justify-between items-start w-full">
            <span className="text-[13px] font-bold text-slate-500">Total Solicitudes</span>
            <div className="w-6 h-6 rounded flex items-center justify-center text-slate-400 border border-slate-100 bg-slate-50"><Package size={12} /></div>
          </div>
          <span className="text-3xl font-black text-[#1e293b] mt-4 mb-1">{counts.Total}</span>
        </button>

        <button onClick={() => setActiveFilter("PENDIENTE")} className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeFilter === "PENDIENTE" ? "border-sky-500 ring-1 ring-sky-500 shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-sm"}`}>
          <div className="flex justify-between items-start w-full">
            <span className="text-[13px] font-bold text-slate-500">Pendientes (Nuevas)</span>
            <div className="w-6 h-6 rounded flex items-center justify-center text-slate-400 border border-slate-100 bg-slate-50"><AlertCircle size={12} /></div>
          </div>
          <span className="text-3xl font-black text-[#1e293b] mt-4 mb-1">{counts.Pendientes}</span>
        </button>

        <button onClick={() => setActiveFilter("EN PREPARACION")} className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeFilter === "EN PREPARACION" ? "border-sky-500 ring-1 ring-sky-500 shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-sm"}`}>
          <div className="flex justify-between items-start w-full">
            <span className="text-[13px] font-bold text-slate-500">En Preparación</span>
            <div className="w-6 h-6 rounded flex items-center justify-center text-slate-400 border border-slate-100 bg-slate-50"><Clock size={12} /></div>
          </div>
          <span className="text-3xl font-black text-[#1e293b] mt-4 mb-1">{counts.Preparacion}</span>
        </button>

        <button onClick={() => setActiveFilter("LISTO PARA ENTREGA")} className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeFilter === "LISTO PARA ENTREGA" ? "border-sky-500 ring-1 ring-sky-500 shadow-sm" : "border-slate-200 hover:border-slate-300 shadow-sm"}`}>
          <div className="flex justify-between items-start w-full">
            <span className="text-[13px] font-bold text-slate-500">Listas para Entrega</span>
            <div className="w-6 h-6 rounded flex items-center justify-center text-slate-400 border border-slate-100 bg-slate-50"><CheckCircle2 size={12} /></div>
          </div>
          <span className="text-3xl font-black text-[#1e293b] mt-4 mb-1">{counts.Listas}</span>
        </button>

      </div>

      {/* CONTENEDOR DE LA TABLA (Clon de la imagen de referencia general) */}
      <div className="flex-1 flex gap-4 min-h-0 w-full overflow-hidden mt-2">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-0 min-w-0">
          
          <div className="px-6 py-5 border-b border-slate-100 flex flex-shrink-0">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" placeholder="Buscar solicitud..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 p-2">
            <Table 
              columns={columns} 
              data={filteredData} 
              enableExport={true}
              exportTitle="Reporte de Solicitudes"
              onView={(row) => setSelectedSolicitud(row)}
            />
          </div>
        </div>

        <ModalSolicitud 
          solicitud={selectedSolicitud}
          isOpen={!!selectedSolicitud}
          onClose={() => setSelectedSolicitud(null)}
          onChangeStatus={handleStatusChange}
        />

      </div>
    </div>
  );
};

export default SolicitudesBodega;