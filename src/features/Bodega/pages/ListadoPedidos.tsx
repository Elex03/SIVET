import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Clock, CheckCircle2, PackagePlus, Search, Filter } from "lucide-react"; 

import PageHeader from "../../../shared/components/Layout/PageHeader";
import SummaryCard from "../../../shared/components/charts/SummaryCard";

import ActivityItem from "../../../shared/components/Layout/ActivityItem";
import Table from "../../../shared/components/Table/Table"; 
import type { TableColumn } from "../../../shared/components/Table/Table"; 

const ListadoPedidos: React.FC = () => {
  const navigate = useNavigate();

  const columns: TableColumn[] = [
    { id: "documento", label: "No. Documento" },
    { id: "proveedor", label: "Proveedor" },
    { id: "fecha", label: "Fecha Recepción" },
    { id: "articulos", label: "Líneas Ingresadas" },
    { 
      id: "estado", 
      label: "Estado",
      render: (row) => {
        if (row.estado === "Completado") {
          return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold">✅ Completado</span>;
        }
        if (row.estado === "Borrador") {
          return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold">⏳ En Progreso</span>;
        }
        return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold">❌ Cancelado</span>;
      }
    },
  ];

  // 2. Data de prueba (Historial de pedidos)
  const pedidosData = [
    {
      id: 1, 
      documento: "FAC-99012",
      proveedor: "Distribuidora Médica S.A.",
      fecha: "14/09/2026",
      articulos: "15",
      estado: "Completado",
    },
    {
      id: 2, 
      documento: "ORD-045",
      proveedor: "Laboratorios PharmaVet",
      fecha: "12/09/2026",
      articulos: "3",
      estado: "Borrador",
    },
    {
      id: 3, 
      documento: "FAC-99088",
      proveedor: "Medisum",
      fecha: "10/09/2026",
      articulos: "0",
      estado: "Cancelado",
    },
  ];

  const handleViewDetails = (row: any) => {
    navigate(`/bodega/pedidos/${row.id}`)
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col h-full">
      <PageHeader 
        header="Historial de Pedidos" 
        sub="Consulta los ingresos previos o registra una nueva recepción de medicamentos." 
      />

      <div className="flex flex-col xl:flex-row gap-8 w-full flex-1 min-h-0">
        
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <SummaryCard title="Total Pedidos (Mes)" value="45" icon={ShoppingCart} trendValue="10%" trendType="up" trendText="vs mes anterior" />
            <SummaryCard title="Recepciones en Progreso" value="2" icon={Clock} trendType="neutral" trendText="Borradores guardados" />
            <SummaryCard title="Ingresos Completados" value="41" icon={CheckCircle2} trendValue="3" trendType="up" trendText="nuevos esta semana" />
          </div>

          {/* Barra de Búsqueda y Botón Principal */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            
            <div className="flex flex-wrap gap-3 flex-1 w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar por factura o proveedor..." 
                className="bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm flex-1 min-w-[200px] shadow-sm outline-none focus:border-blue-400" 
              />
              
              <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm hover:bg-gray-50">
                <Filter size={16} /> Filtros
              </button>
            </div>

            <button 
              onClick={() => navigate("/bodega/pedidos/recepcion")}
              className="bg-[#3b82f6] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm flex-shrink-0 w-full sm:w-auto justify-center"
            >
              <PackagePlus size={18} />
              <span>Recibir Nuevo Pedido</span>
            </button>
          </div>

          <Table 
            columns={columns} 
            data={pedidosData} 
            onView={handleViewDetails}
          />
          
        </div>
        <div className="w-full xl:w-[320px] flex flex-col gap-6 flex-shrink-0 h-full">
          
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex justify-between items-end mb-1">
              <h3 className="font-semibold text-[#304a6d]">
                Actividad de Recepciones
              </h3>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 overflow-y-auto h-full">
              <ActivityItem icon="✅" time="Hoy, 10:45 AM" description="Dr. Pérez completó el ingreso FAC-99012." />
              <ActivityItem icon="⏳" time="Ayer, 04:30 PM" description="Se pausó la recepción ORD-045 (Borrador)." />
              <ActivityItem icon="❌" time="10 Sep, 11:20 AM" description="Se canceló el ingreso de la FAC-99088." />
              <ActivityItem icon="📦" time="08 Sep, 09:15 AM" description="Nuevo lote de jeringas ingresado." />
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default ListadoPedidos;