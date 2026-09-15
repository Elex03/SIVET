import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingCart, Clock, CheckCircle2, PackagePlus, 
  Search, Filter, Check, AlertCircle, X, Package, 
  FileText, Download 
} from "lucide-react"; 

import PageHeader from "../../../shared/components/Layout/PageHeader";
import SummaryCard from "../../../shared/components/charts/SummaryCard";

import ActivityItem from "../../../shared/components/Layout/ActivityItem";
import Table from "../../../shared/components/Table/Table"; 
import type {TableColumn} from "../../../shared/components/Table/Table"; 
import Modal from "../../../shared/components/Layout/Modal";

import { generatePDFTemplate } from "../../../shared/utils/printUtils";

const ListadoPedidos: React.FC = () => {
  const navigate = useNavigate();

  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"productos" | "documento">("productos");

  // Configuración de las columnas principales
  const columns: TableColumn[] = [
    { id: "documento", label: "No. Documento" },
    { id: "proveedor", label: "Proveedor" },
    { id: "fecha", label: "Fecha Recepción" },
    { id: "articulos", label: "Líneas Ingresadas" },
    { 
      id: "estado", 
      label: "Estado",
      /*
      render: (row) => {
        if (row.estado === "Completado") return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold">✅ Completado</span>;
        if (row.estado === "Borrador") return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold">⏳ En Progreso</span>;
        return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold">❌ Cancelado</span>;
      }
        */
    },
  ];

  // Data de prueba (Ahora incluye los productos internos de cada pedido)
  const pedidosData = [
    { 
      id: 1, 
      documento: "FAC-99012", 
      proveedor: "Distribuidora Médica S.A.", 
      fecha: "14/09/2026", 
      articulos: "2", 
      estado: "Completado",
      productos: [
        { codigo: "MED-001", nombre: "Oxitetraciclina 20%", lote: "L-9923", caducidad: "10/2028", cantidad: "120 Frascos" },
        { codigo: "MED-005", nombre: "Amoxicilina 500mg", lote: "L-1102", caducidad: "05/2027", cantidad: "100 Cajas" },
      ]
    },
    { 
      id: 2, 
      documento: "ORD-045", 
      proveedor: "Laboratorios PharmaVet", 
      fecha: "12/09/2026", 
      articulos: "1", 
      estado: "Borrador",
      productos: [
        { codigo: "INS-001", nombre: "Jeringa 5ml", lote: "PENDIENTE", caducidad: "PENDIENTE", cantidad: "50 Cajas" },
      ]
    },
  ];

  // ==========================================
  // ACCIÓN: VER DETALLES (Abre el Popup)
  // ==========================================
  const handleViewDetails = (row: any) => {
    setSelectedPedido(row);
    setActiveTab("productos"); // Reinicia a la pestaña de productos
    setIsModalOpen(true);
  };

  // ==========================================
  // ACCIÓN: DESCARGAR PDF DESDE EL MODAL
  // ==========================================
  const handleDownloadPDF = () => {
    if (!selectedPedido) return;

    // Usamos la utilidad pasándole los datos mapeados del pedido seleccionado
    generatePDFTemplate({
      title: `Reporte de Recepción: ${selectedPedido.documento}`,
      subtitle: `Proveedor: ${selectedPedido.proveedor} | Fecha: ${selectedPedido.fecha}`,
      columns: ["Código", "Medicamento", "Lote", "Vencimiento", "Cantidad"],
      data: selectedPedido.productos.map((p: any) => [
        p.codigo, 
        p.nombre, 
        p.lote, 
        p.caducidad, 
        p.cantidad
      ])
    });
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col h-full relative">
      <PageHeader header="Historial de Pedidos" sub="Consulta los ingresos previos o registra una nueva recepción de medicamentos." />

      <div className="flex flex-col xl:flex-row gap-8 w-full flex-1 min-h-0">
        
        {/* COLUMNA PRINCIPAL */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <SummaryCard title="Total Pedidos (Mes)" value="45" icon={ShoppingCart} trendValue="10%" trendType="up" />
            <SummaryCard title="Recepciones en Progreso" value="2" icon={Clock} trendType="neutral" />
            <SummaryCard title="Ingresos Completados" value="41" icon={CheckCircle2} trendValue="3" trendType="up" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex flex-wrap gap-3 flex-1 w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input type="text" placeholder="Buscar por factura o proveedor..." className="bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm flex-1 min-w-[200px] shadow-sm outline-none focus:border-blue-400" />
            </div>

            <button onClick={() => navigate("/bodega/pedidos/recepcion")} className="bg-[#3b82f6] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
              <PackagePlus size={18} /><span>Recibir Nuevo Pedido</span>
            </button>
          </div>

          {/* Tabla Principal */}
          <Table 
            columns={columns} 
            data={pedidosData} 
            onView={handleViewDetails} // Abre el modal
          />
        </div>

        {/* COLUMNA LATERAL (Actividad Reciente) */}
        <div className="w-full xl:w-[320px] flex flex-col gap-6 flex-shrink-0 h-full">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-y-auto h-full">
              <h3 className="font-semibold text-[#304a6d] mb-4">Actividad Reciente</h3>
              <ActivityItem icon={<Check size={16} strokeWidth={3} />} time="Hoy, 10:45 AM" description="Dr. Pérez completó el ingreso FAC-99012." variant="success" />
              <ActivityItem icon={<AlertCircle size={16} strokeWidth={3} />} time="Ayer, 04:30 PM" description="Se pausó recepción ORD-045." variant="warning" />
              <ActivityItem icon={<X size={16} strokeWidth={3} />} time="10 Sep, 11:20 AM" description="Cancelada FAC-99088." variant="error" />
              <ActivityItem icon={<Package size={16} strokeWidth={2.5} />} time="08 Sep, 09:15 AM" description="Nuevo lote ingresado." variant="info" isLast={true} />
            </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL DE DETALLES DEL PEDIDO */}
      {/* ========================================== */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Detalle de Recepción"
        subtitle={selectedPedido ? `${selectedPedido.documento} • ${selectedPedido.proveedor}` : ""}
        maxWidth="max-w-3xl"
      >
        {selectedPedido && (
          <div className="flex flex-col gap-4">
            
            {/* Pestañas (Tabs) */}
            <div className="flex bg-gray-50 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab("productos")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "productos" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Package size={16} className="inline mr-2" /> Productos Ingresados
              </button>
              <button 
                onClick={() => setActiveTab("documento")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "documento" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <FileText size={16} className="inline mr-2" /> Documento Adjunto
              </button>
            </div>

            {/* TAB 1: Tabla de Productos */}
            {activeTab === "productos" && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Medicamento</th>
                      <th className="px-4 py-3">Lote</th>
                      <th className="px-4 py-3">Caducidad</th>
                      <th className="px-4 py-3">Cant.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPedido.productos.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 font-mono">{p.codigo}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                        <td className="px-4 py-3 text-gray-600">{p.lote}</td>
                        <td className="px-4 py-3 text-gray-600">{p.caducidad}</td>
                        <td className="px-4 py-3 font-semibold text-blue-600">{p.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Vista Previa del Documento */}
            {activeTab === "documento" && (
              <div className="w-full h-[350px] bg-gray-50 border border-gray-200 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400">
                <FileText size={48} className="mb-3 opacity-50" />
                <p className="text-sm font-medium text-gray-600">Vista previa de la factura escaneada</p>
                <p className="text-xs mt-1">{selectedPedido.documento}.pdf</p>
              </div>
            )}

            {/* FOOTER DEL MODAL (Botones de acción) */}
            <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Registrado el {selectedPedido.fecha}
              </span>
              
              {/* Botón para generar PDF, visible sólo si estamos en la pestaña de productos */}
              {activeTab === "productos" && (
                <button 
                  onClick={handleDownloadPDF}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Download size={16} /> Descargar Tabla en PDF
                </button>
              )}
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};

export default ListadoPedidos;