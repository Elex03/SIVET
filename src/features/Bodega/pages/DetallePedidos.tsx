import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download, FileText, Package } from "lucide-react";
/*import PageHeader from "../../../shared/components/Layout/PageHeader";*/

const DetallePedido: React.FC = () => {
  const navigate = useNavigate();
  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState<"productos" | "documento">("productos");

  // Data simulada del detalle del pedido
  const pedido = {
    documento: "FAC-99012",
    proveedor: "Distribuidora Médica S.A.",
    fecha: "14 de Septiembre, 2026",
    responsable: "Dr. J. Pérez",
    estado: "Completado",
    totalUnidades: 220,
    productos: [
      { id: 1, codigo: "MED-001", nombre: "Oxitetraciclina 20%", lote: "L-9923", caducidad: "10/2028", cantidad: 120, unidad: "Frascos" },
      { id: 2, codigo: "MED-005", nombre: "Amoxicilina 500mg", lote: "L-1102", caducidad: "05/2027", cantidad: 100, unidad: "Cajas" },
    ]
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col h-full">
      
      {/* HEADER Y ACCIONES */}
      <div className="flex justify-between items-start mb-6 mt-2">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate(-1)} // Vuelve a la página anterior
            className="p-2 mt-1 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-semibold leading-none tracking-tight text-[#304a6d] m-0">
              Detalle de Recepción
            </h1>
            <p className="text-sm text-slate-500 mt-1 m-0 font-normal">
              {pedido.documento} • {pedido.proveedor}
            </p>
          </div>
        </div>

        {/* Botones de Exportación */}
        <div className="flex gap-3">
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm hover:bg-gray-50">
            <Printer size={16} /> Imprimir
          </button>
          <button className="bg-[#3b82f6] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Download size={16} /> Generar PDF
          </button>
        </div>
      </div>

      {/* TARJETA DE INFORMACIÓN GENERAL */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-8">
        <div>
          <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Estado</span>
          <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold">✅ {pedido.estado}</span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Fecha de Recepción</span>
          <span className="text-sm font-medium text-gray-800">{pedido.fecha}</span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Responsable</span>
          <span className="text-sm font-medium text-gray-800">{pedido.responsable}</span>
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Unidades Físicas</span>
          <span className="text-sm font-medium text-[#3b82f6]">{pedido.totalUnidades}</span>
        </div>
      </div>

      {/* CONTENEDOR DE PESTAÑAS (TABS) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Cabecera de los Tabs */}
        <div className="flex border-b border-gray-100 px-2">
          <button 
            onClick={() => setActiveTab("productos")}
            className={`px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "productos" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package size={18} /> Productos Ingresados
          </button>
          
          <button 
            onClick={() => setActiveTab("documento")}
            className={`px-6 py-4 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "documento" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText size={18} /> Documento Adjunto
          </button>
        </div>

        {/* Contenido de los Tabs */}
        <div className="flex-1 overflow-y-auto p-0">
          
          {/* TAB 1: PRODUCTOS */}
          {activeTab === "productos" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Medicamento</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Lote</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedido.productos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{prod.codigo}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{prod.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prod.lote}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prod.caducidad}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                      {prod.cantidad} <span className="text-[11px] text-gray-400 font-normal uppercase ml-1">{prod.unidad}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TAB 2: DOCUMENTO ADJUNTO */}
          {activeTab === "documento" && (
            <div className="p-6 h-full flex flex-col items-center justify-center bg-gray-50">
              <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-sm p-2 rounded-lg flex flex-col items-center">
                {/* Aquí iría la etiqueta <embed> o <iframe> apuntando a la URL del PDF del backend */}
                <div className="w-full h-[400px] bg-gray-100 border border-gray-200 border-dashed rounded flex flex-col items-center justify-center text-gray-400">
                  <FileText size={48} className="mb-2 opacity-50" />
                  <p className="text-sm font-medium">Vista previa del PDF de la factura</p>
                  <p className="text-xs mt-1">FAC-99012.pdf</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DetallePedido;