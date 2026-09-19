import React, { useState } from "react";
import { X, UploadCloud, Check } from "lucide-react";

type ModalTabType = "basica" | "inventario";

// ==========================================
// INTERFAZ EXACTA QUE ESPERA CATALOGOS.TSX
// ==========================================
interface ModalMedicamentoProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalMedicamento: React.FC<ModalMedicamentoProps> = ({ isOpen, onClose }) => {
  const [modalTab, setModalTab] = useState<ModalTabType>("basica");

  // Si Catalogos.tsx manda isOpen=false, el modal no se dibuja
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-auto max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header del Modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-[#304a6d]">Agregar nuevo medicamento</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Sección Superior (Siempre visible) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nombre</label>
              <input type="text" placeholder="Ej. Amoxicilina 500mg" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Acción terapéutica</label>
              <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors cursor-pointer">
                <option value="">Seleccionar acción...</option>
                <option value="1">Antibiótico</option>
                <option value="2">Desparasitante</option>
                <option value="3">Anestésico</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Código de barra</label>
              <input type="text" placeholder="Escanea o escribe el código" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
            </div>
            <div className="flex items-center md:mt-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 border-2 border-slate-300 rounded-md group-hover:border-[#3b82f6] transition-colors">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 rounded-md peer-checked:bg-[#3b82f6] peer-checked:border-[#3b82f6] absolute flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-all">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-700">Requiere prescripción médica</span>
              </label>
            </div>
          </div>

          {/* Pestañas del Formulario */}
          <div className="flex border-b border-slate-200 mb-6">
            <button 
              onClick={() => setModalTab("basica")}
              className={`px-5 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px ${modalTab === "basica" ? "border-[#3b82f6] text-[#304a6d]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
            >
              Información Básica
            </button>
            <button 
              onClick={() => setModalTab("inventario")}
              className={`px-5 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px ${modalTab === "inventario" ? "border-[#3b82f6] text-[#304a6d]" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
            >
              Datos de Inventario
            </button>
          </div>

          {/* Contenido de la Pestaña: Información Básica */}
          {modalTab === "basica" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-200 border border-slate-100 bg-slate-50/30 rounded-xl p-5">
              
              {/* Columna Izquierda: Presentación */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Presentación / Empaque</label>
                  <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors cursor-pointer">
                    <option value="">Seleccione el empaque principal</option>
                    <option value="CAJAS">CAJAS</option>
                    <option value="FRASCO">FRASCO</option>
                    <option value="BLISTER">BLÍSTER</option>
                    <option value="TABLETAS">TABLETAS</option>
                    <option value="AMPOLLAS">AMPOLLAS</option>
                    <option value="VIALES">VIALES</option>
                    <option value="TUBOS">TUBOS</option>
                    <option value="SOBRES">SOBRES</option>
                    <option value="BOTELLAS">BOTELLAS</option>
                    <option value="CUBETAS">CUBETAS</option>
                    <option value="GALONES">GALONES</option>
                    <option value="BOLSAS">BOLSAS</option>
                    <option value="UNIDAD">UNIDAD</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Fabricante / Marca</label>
                  <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors cursor-pointer">
                    <option value="">Seleccione el fabricante</option>
                    <option value="1">Biozoo</option>
                    <option value="2">Montana</option>
                    <option value="3">Richmond Vet Pharma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Síntomas que trata (Opcional)</label>
                  <textarea rows={4} placeholder="Breve descripción clínica..." className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors resize-none"></textarea>
                </div>
              </div>

              {/* Columna Derecha: UXE e Imagen */}
              <div className="flex flex-col gap-4">
                
                {/* Configuración de UXE */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">UXE (Unidad Interna)</label>
                    <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors cursor-pointer">
                      <option value="">Seleccione...</option>
                      <option value="ML">Mililitros (ML)</option>
                      <option value="MG">Miligramos (MG)</option>
                      <option value="G">Gramos (G)</option>
                      <option value="KG">Kilogramos (KG)</option>
                      <option value="TAB">Tabletas (TAB)</option>
                      <option value="CAPS">Cápsulas (CAPS)</option>
                      <option value="UND">Unidades (UND)</option>
                      <option value="AMP">Ampollas (AMP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Cant. por defecto</label>
                    <input type="number" placeholder="Ej. 100" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col mt-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Imagen del producto</label>
                  <div className="flex-1 border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors min-h-[140px]">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-2 border border-slate-100">
                      <UploadCloud size={20} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">Haz clic para subir imagen</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Contenido de la Pestaña: Datos de Inventario */}
          {modalTab === "inventario" && (
            <div className="animate-in fade-in duration-200 border border-slate-100 bg-slate-50/30 rounded-xl p-5">
              <h3 className="text-sm font-bold text-[#304a6d] mb-4">Niveles de Alerta de Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Stock Mínimo (Alerta)</label>
                  <input type="number" placeholder="Ej. 10" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-rose-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Stock Máximo (Capacidad)</label>
                  <input type="number" placeholder="Ej. 500" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer del Modal (Botones) */}
        <div className="px-6 py-4 flex justify-end gap-3 flex-shrink-0 border-t border-slate-100 bg-white">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors bg-white"
          >
            Cancelar
          </button>
          <button 
            className="px-8 py-2.5 rounded-xl bg-[#3b82f6] text-white font-bold text-sm hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Check size={16} /> Guardar Medicamento
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalMedicamento;