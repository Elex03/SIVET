import React, { useState } from "react";
import { X, UploadCloud, Check } from "lucide-react";

type ModalTabType = "basica" | "inventario";

interface ModalMedicamentoProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalMedicamento: React.FC<ModalMedicamentoProps> = ({ isOpen, onClose }) => {
  const [modalTab, setModalTab] = useState<ModalTabType>("basica");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* 
        AJUSTE DE ALTURA: 
        Se eliminó h-[650px]. Ahora usa "h-auto" para adaptarse exactamente al contenido.
        Se mantiene max-h-[95vh] solo como medida de seguridad para pantallas muy pequeñas.
      */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-auto max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header del Modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-[#304a6d]">Agregar nuevo medicamento</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Contenido (Sin scroll forzado, se expande lo necesario) */}
        <div className="p-6">
          
          {/* Sección Superior (Siempre visible) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Nombre</label>
              <input type="text" placeholder="Ingresa el nombre del medicamento" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Accion terapeutica</label>
              <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors cursor-pointer">
                <option value="">Seleccionar accion terapeutica</option>
                <option value="1">Antibiótico</option>
                <option value="2">Desparasitante</option>
                <option value="3">Anestésico</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Código de barra</label>
              <input type="text" placeholder="Escanea o escribe el código de barra" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
            </div>
            <div className="flex items-center md:mt-5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 rounded-md group-hover:border-[#3b82f6] transition-colors">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 rounded-md peer-checked:bg-[#3b82f6] peer-checked:border-[#3b82f6] absolute flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-all">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-700">Requiere prescripcion medica</span>
              </label>
            </div>
          </div>

          {/* Pestañas del Formulario */}
          <div className="flex border-b border-slate-200 mb-6">
            <button 
              onClick={() => setModalTab("basica")}
              className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${modalTab === "basica" ? "border-blue-300 bg-blue-100/50 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
            >
              Informacion basica
            </button>
            <button 
              onClick={() => setModalTab("inventario")}
              className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${modalTab === "inventario" ? "border-blue-300 bg-blue-100/50 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
            >
              Datos de Inventario
            </button>
          </div>

          {/* Contenido de la Pestaña: Información Básica */}
          {modalTab === "basica" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200 border border-slate-200 rounded-lg p-5">
              
              {/* Columna Izquierda */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Presentacion</label>
                  <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors cursor-pointer">
                    <option value="">Ingresa la concentración</option>
                    <option value="caja">Caja</option>
                    <option value="frasco">Frasco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Fabricante</label>
                  <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors cursor-pointer">
                    <option value="">Seleccione el fabricante</option>
                    <option value="1">Biozoo</option>
                    <option value="2">Montana</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Dosis</label>
                    <input type="text" placeholder="Dosis" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Via</label>
                    <input type="text" placeholder="Via" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Sintomas que trata</label>
                  <textarea rows={5} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors resize-none"></textarea>
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Unidad Interna</label>
                  <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors cursor-pointer">
                    <option value="">Seleccione la unidad interna</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="mg">Miligramos (mg)</option>
                    <option value="tab">Tabletas (tab)</option>
                  </select>
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Seleccione una imagen</label>
                  <div className="flex-1 border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors min-h-[220px]">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100">
                      <UploadCloud size={20} className="text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Contenido de la Pestaña: Datos de Inventario */}
          {modalTab === "inventario" && (
            <div className="animate-in fade-in duration-200 border border-slate-200 rounded-lg p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Cantidad minima</label>
                  <input type="number" placeholder="0" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Cantidad maxima</label>
                  <input type="number" placeholder="0" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer del Modal (Botones) */}
        <div className="px-6 py-4 flex justify-end gap-3 flex-shrink-0 mt-2">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors bg-white"
          >
            Cancelar
          </button>
          <button 
            className="px-8 py-2.5 rounded-xl bg-[#3b82f6] text-white font-bold text-sm hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all"
          >
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalMedicamento;