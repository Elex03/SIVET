import React from "react";
import { Trash2, Inbox, Image as ImageIcon } from "lucide-react";

export interface ReceptionProduct {
  id: number;
  codigo: string;
  nombre: string;
  marca: string;
  lote: string;
  caducidad: string;
  cantidad: string | number;
  unidad_medida: string;
  uxe_cantidad: string | number;
  uxe_unidad: string;
  imagen?: string;
}

interface ReceptionTableProps {
  productos: ReceptionProduct[];
  onRemove: (id: number) => void;
  onChange: (id: number, field: keyof ReceptionProduct, value: string | number) => void;
}

const ReceptionTable: React.FC<ReceptionTableProps> = ({ productos, onRemove, onChange }) => {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-14 text-center">IMG</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Descripción y Marca</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-36">Lote *</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-36">Vencimiento *</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24">Cantidad</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-28">U. Medida</th>
              {/* Le di un poco más de ancho a esta columna para que quepa bien el nuevo select */}
              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-40">UXE</th>
              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-14 text-center"></th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100 bg-white">
            {productos.length > 0 ? (
              productos.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors group">
                  {/* IMAGEN */}
                  <td className="px-4 py-2.5 align-middle">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center mx-auto overflow-hidden shadow-sm">
                      {prod.imagen ? (
                        <img src={prod.imagen} alt="img" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="text-slate-300" />
                      )}
                    </div>
                  </td>

                  {/* DESCRIPCIÓN */}
                  <td className="px-4 py-2.5 align-middle">
                    <span className="block text-sm font-bold text-[#304a6d] leading-tight">{prod.nombre}</span>
                    <span className="block text-xs font-semibold text-slate-500 mt-0.5">{prod.marca}</span>
                  </td>

                  {/* LOTE */}
                  <td className="px-4 py-2.5 align-middle">
                    <input 
                      type="text" 
                      placeholder="No. Lote"
                      value={prod.lote}
                      onChange={(e) => onChange(prod.id, "lote", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-300 uppercase"
                    />
                  </td>

                  {/* VENCIMIENTO */}
                  <td className="px-4 py-2.5 align-middle">
                    <input 
                      type="date" 
                      value={prod.caducidad}
                      onChange={(e) => onChange(prod.id, "caducidad", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </td>

                  {/* CANTIDAD (Empaques a recibir) */}
                  <td className="px-4 py-2.5 align-middle">
                    <input 
                      type="number" 
                      min="1"
                      placeholder="0"
                      value={prod.cantidad}
                      onChange={(e) => onChange(prod.id, "cantidad", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-bold text-center"
                    />
                  </td>

                  {/* TIPO DE EMPAQUE (U. MEDIDA) */}
                  <td className="px-4 py-2.5 align-middle">
                    <select 
                      value={prod.unidad_medida}
                      onChange={(e) => onChange(prod.id, "unidad_medida", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-600 outline-none cursor-pointer focus:border-sky-500 transition-all"
                    >
                      <option value="CAJAS">CAJAS</option>
                      <option value="FRASCO">FRASCO</option>
                      <option value="BOTELLAS">BOTELLAS</option>
                      <option value="CUBETAS">CUBETAS</option>
                      <option value="BOLSAS">BOLSAS</option>
                      <option value="UNIDAD">UNIDAD</option>
                    </select>
                  </td>

                  {/* UXE (Unidades por Empaque + Tipo de unidad) */}
                  <td className="px-4 py-2.5 align-middle">
                    <div className="flex items-center gap-1">
                      {/* Cantidad interna */}
                      <input 
                        type="number" 
                        min="1"
                        placeholder="1"
                        value={prod.uxe_cantidad}
                        onChange={(e) => onChange(prod.id, "uxe_cantidad", e.target.value)}
                        className="w-14 bg-white border border-slate-200 rounded-l-md px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-center z-10"
                      />
                      {/* Tipo de unidad interna */}
                      <select
                        value={prod.uxe_unidad}
                        onChange={(e) => onChange(prod.id, "uxe_unidad", e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 border-l-0 rounded-r-md px-1 py-1.5 text-xs font-semibold text-slate-500 outline-none cursor-pointer hover:bg-slate-100 transition-all uppercase"
                      >
                        <option value="ML">ML</option>
                        <option value="MG">MG</option>
                        <option value="G">G</option>
                        <option value="KG">KG</option>
                        <option value="TAB">TAB</option>
                        <option value="CAPS">CAPS</option>
                        <option value="UND">UND</option>
                        <option value="AMP">AMP</option>
                      </select>
                    </div>
                  </td>

                  {/* ACCIÓN (Eliminar) */}
                  <td className="px-4 py-2.5 text-center align-middle">
                    <button 
                      onClick={() => onRemove(prod.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Quitar producto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border-none">
                  <div className="flex flex-col items-center pt-24 pb-16 w-full text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                      <Inbox size={28} className="text-slate-300" />
                    </div>
                    <p className="text-base font-bold text-[#304a6d]">No hay productos en la recepción</p>
                    <p className="text-sm text-slate-500 mt-1">Busca un producto en la barra superior para agregarlo</p>
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