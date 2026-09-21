import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Printer, FileText, AlertCircle, Clock, Image as ImageIcon, MessageSquare
} from "lucide-react";

interface ModalSolicitudProps {
  solicitud: any;
  isOpen: boolean;
  onClose: () => void;
  onChangeStatus: (id: string, newStatus: string) => void;
}

const ModalSolicitud: React.FC<ModalSolicitudProps> = ({ 
  solicitud, isOpen, onClose, onChangeStatus 
}) => {
  const [observacionesBodega, setObservacionesBodega] = useState("");

  if (!solicitud) return null;

  // Lógica de impresión nativa
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write('<html><head><title>Imprimir Solicitud</title></head><body><h1>Orden ' + solicitud.id + '</h1><script>window.print();</script></body></html>');
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          
          {/* Fondo oscuro */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          />

          {/* Ventana Modal Centrada */}
          <motion.div 
            initial={{ scale: 0.97, opacity: 0, y: 10 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.97, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col relative z-10"
          >
            
            {/* 1. CABECERA OFICIAL */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-white flex-shrink-0 rounded-t-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 text-[#304a6d] flex-shrink-0 mt-1 shadow-sm">
                  <FileText size={24} strokeWidth={1.5} />
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-[#1e293b] leading-tight">Solicitud de Insumos</h2>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-xs font-mono font-bold tracking-widest border border-slate-200 shadow-sm">
                      {solicitud.id}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {solicitud.estado === "PENDIENTE" && <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pendiente de Revisión</span>}
                    {solicitud.estado === "EN PREPARACION" && <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">En Preparación</span>}
                    {solicitud.estado === "LISTO PARA ENTREGA" && <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Listo para Entregar</span>}
                    {solicitud.estado === "COMPLETADO" && <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Completado</span>}
                    
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    
                    {solicitud.prioridad === "URGENTE" && <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1"><AlertCircle size={13}/> Urgente</span>}
                    {solicitud.prioridad === "ALTA" && <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">Alta</span>}
                    {solicitud.prioridad === "NORMAL" && <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Normal</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                  <Printer size={16}/> Imprimir
                </button>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors bg-white border border-slate-100">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 2. CUERPO DEL DOCUMENTO (SCROLL) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col">
              
              <div className="px-8 py-6 flex flex-col gap-8">
                {/* A. Info General (AHORA MÁS GRANDE Y LEGIBLE) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Destino / Área</span>
                    <span className="text-base font-bold text-[#1e293b]">{solicitud.farmacia}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Solicitado por</span>
                    <span className="text-base font-bold text-[#1e293b]">{solicitud.solicitante}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de Solicitud</span>
                    <span className="text-base font-medium text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Clock size={16} className="text-slate-400"/> 
                      {new Date(solicitud.fecha).toLocaleString('es-NI', { dateStyle: 'long', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                {/* B. Doble Panel de Observaciones */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare size={14}/> Nota de {solicitud.farmacia}
                    </span>
                    <p className="text-[13px] text-slate-600 italic">
                      {solicitud.nota_farmacia || "No se adjuntaron observaciones en esta solicitud."}
                    </p>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Añadir Observación (Bodega)
                    </span>
                    <textarea 
                      value={observacionesBodega}
                      onChange={(e) => setObservacionesBodega(e.target.value)}
                      placeholder="Escribe un mensaje o justificación para Farmacia..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-700 outline-none focus:border-[#3b82f6] transition-colors resize-none flex-1 min-h-[80px]"
                    ></textarea>
                  </div>
                </div>

                {/* C. Tabla de Insumos UNIFORME Y SIN DESBORDES */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#f8fafc] border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-16 text-center">IMG</th>
                        <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-28">Código</th>
                        <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Medicamento / Producto</th>
                        <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center w-28">Stock Disp.</th>
                        <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center w-32">Estado</th>
                        <th className="px-5 py-3.5 text-[11px] font-bold text-[#304a6d] uppercase tracking-wider text-right w-36">Cant. Solicitada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {solicitud.items.map((item: any) => {
                        const stockValue = item.stock_disponible || 0;
                        const isInsufficient = stockValue < item.cantidad;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 align-middle text-center">
                              <div className="w-9 h-9 mx-auto rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                                {item.imagen ? <img src={item.imagen} alt="img" className="w-full h-full object-cover"/> : <ImageIcon size={16} className="text-slate-300" />}
                              </div>
                            </td>
                            
                            <td className="px-5 py-3 align-middle">
                              <span className="text-[13px] font-mono font-medium text-slate-500">{item.codigo}</span>
                            </td>
                            
                            <td className="px-5 py-3 align-middle">
                              <span className="block text-[13px] font-bold text-[#1e293b]">{item.producto}</span>
                            </td>
                            
                            <td className="px-5 py-3 align-middle text-center">
                              <span className={`text-[13px] font-bold ${isInsufficient ? 'text-rose-600' : 'text-slate-700'}`}>
                                {stockValue}
                              </span>
                            </td>

                            {/* ESTADO DEL INVENTARIO (UNA SOLA PALABRA, SIN SALTO DE LÍNEA) */}
                            <td className="px-5 py-3 align-middle text-center">
                              {isInsufficient ? (
                                <span className="px-2.5 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded uppercase tracking-wider whitespace-nowrap">
                                  INSUFICIENTE
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded uppercase tracking-wider whitespace-nowrap">
                                  SUFICIENTE
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-3 align-middle text-right bg-blue-50/10">
                              <span className="text-[13px] font-bold text-[#304a6d]">{item.cantidad}</span>
                              <span className="text-[10px] font-bold text-slate-400 ml-1.5 uppercase tracking-wider">{item.unidad}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* 3. FOOTER DE ACCIONES */}
            {/* ========================================== */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0 rounded-b-2xl">
              
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                  Cancelar
                </button>
                <button className="px-6 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-sm">
                  Negar Solicitud
                </button>
              </div>

              {solicitud.estado === "PENDIENTE" && (
                <button 
                  onClick={() => {
                    onChangeStatus(solicitud.id, "EN PREPARACION");
                    onClose();
                  }} 
                  className="px-8 py-3 bg-[#3b82f6] hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20"
                >
                  Preparar Solicitud
                </button>
              )}

              {solicitud.estado === "EN PREPARACION" && (
                <button 
                  onClick={() => {
                    onChangeStatus(solicitud.id, "LISTO PARA ENTREGA");
                    onClose();
                  }} 
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  Marcar como Listo
                </button>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalSolicitud;