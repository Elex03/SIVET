import React from "react";
import { Trash2, Package, Inbox } from "lucide-react";

export const UNIDADES_MEDIDA = ["CAJAS", "FRASCO", "BOTELLAS", "GALON", "UNIDAD", "SOBRE", "SACO", "TUBO"];
export const UNIDADES_UXE = ["TAB", "ML", "G", "MG", "CAPS", "L", "KG", "UND"];

export interface ReceptionProduct {
  id: number;
  codigo: string;
  nombre: string;
  marca: string;
  lote: string;
  caducidad: string;
  cantidad: number | string;
  unidad_medida: string;
  uxe_cantidad: number | string;
  uxe_unidad: string;
}

interface ReceptionTableProps {
  productos: ReceptionProduct[];
  onRemove: (id: number) => void;
  onChange: (id: number, field: keyof ReceptionProduct, value: string | number) => void;
}

const ReceptionTable: React.FC<ReceptionTableProps> = ({ productos, onRemove, onChange }) => {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-[300px]">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-12">Img</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider min-w-[220px]">Descripción y Marca</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-32">Lote *</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-36">Vencimiento *</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-44">Cant. Recibida *</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-44">Unidades (UXE) *</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Total Base</th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-12">Acc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productos.length > 0 ? (
              productos.map((prod) => {
                const totalBase = (Number(prod.cantidad) || 0) * (Number(prod.uxe_cantidad) || 0);

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors group">
                    
                    {/* 1. IMAGEN */}
                    <td className="px-4 py-4 align-top">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <Package size={20} />
                      </div>
                    </td>
                    
                    {/* 2. MEDICAMENTO Y MARCA */}
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-mono mb-0.5">{prod.codigo}</span>
                        <span className="text-sm font-semibold text-slate-800 leading-tight mb-1">{prod.nombre}</span>
                        <span className="text-[10px] text-[#3b82f6] font-bold uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-md self-start">
                          {prod.marca}
                        </span>
                      </div>
                    </td>
                    
                    {/* 3. LOTE (Separado) */}
                    <td className="px-4 py-4 align-top">
                      <input
                        type="text"
                        placeholder="Ej. L-123"
                        value={prod.lote}
                        onChange={(e) => onChange(prod.id, "lote", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all uppercase placeholder:normal-case"
                      />
                    </td>

                    {/* 4. VENCIMIENTO (Separado) */}
                    <td className="px-4 py-4 align-top">
                      <input
                        type="month"
                        value={prod.caducidad}
                        onChange={(e) => onChange(prod.id, "caducidad", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all"
                      />
                    </td>
                    
                    {/* 5. CANTIDAD RECIBIDA (Inputs separados y limpios) */}
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" min="1" placeholder="0"
                          value={prod.cantidad} onChange={(e) => onChange(prod.id, "cantidad", e.target.value)}
                          className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm text-center font-semibold text-slate-800 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all shadow-sm"
                        />
                        <select 
                          value={prod.unidad_medida} onChange={(e) => onChange(prod.id, "unidad_medida", e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all shadow-sm cursor-pointer appearance-none"
                        >
                          <option value="">Medida...</option>
                          {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </td>

                    {/* 6. UXE (Inputs separados y limpios) */}
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" min="1" placeholder="0"
                          value={prod.uxe_cantidad} onChange={(e) => onChange(prod.id, "uxe_cantidad", e.target.value)}
                          className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm text-center font-semibold text-slate-800 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all shadow-sm"
                        />
                        <select 
                          value={prod.uxe_unidad} onChange={(e) => onChange(prod.id, "uxe_unidad", e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all shadow-sm cursor-pointer appearance-none"
                        >
                          <option value="">Und...</option>
                          {UNIDADES_UXE.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </td>
                    
                    {/* 7. TOTAL AUTOMÁTICO */}
                    <td className="px-4 py-4 align-middle text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[1.1rem] font-bold text-[#304a6d]">{totalBase > 0 ? totalBase : 0}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                          {prod.uxe_unidad || "UND"}
                        </span>
                      </div>
                    </td>

                    {/* 8. ACCIONES */}
                    <td className="px-4 py-4 align-middle text-right">
                      <button
                        onClick={() => onRemove(prod.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar fila"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <Inbox size={28} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No hay productos en la recepción</p>
                    <p className="text-xs text-slate-400 mt-1">Busca un producto en la barra superior para agregarlo.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceptionTable;