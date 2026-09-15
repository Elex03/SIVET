import React from "react";
import { X } from "lucide-react";

interface ModalTerapeuticaProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalTerapeutica: React.FC<ModalTerapeuticaProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg h-auto max-h-[95vh] flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-[#304a6d]">Nueva Acción Terapéutica</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre de la Acción</label>
            <input type="text" placeholder="Ej. Antibiótico de amplio espectro" className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors" />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descripción / Uso Principal</label>
            <textarea rows={4} placeholder="Describe brevemente el uso de esta acción terapéutica..." className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors resize-none"></textarea>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estado</label>
            <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] transition-colors cursor-pointer">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 flex-shrink-0 mt-2 bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors bg-white">
            Cancelar
          </button>
          <button className="px-8 py-2.5 rounded-xl bg-[#3b82f6] text-white font-bold text-sm hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all">
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalTerapeutica;