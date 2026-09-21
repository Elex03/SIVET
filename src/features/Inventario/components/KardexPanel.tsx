import React, { useState } from "react";
import { 
  X, MapPin, ArrowRightLeft, Calendar, 
  ArrowDownRight, ArrowUpRight, Maximize2, 
  Download, Filter, Search, FileText
} from "lucide-react";

// Utilizamos la misma interfaz de tu Inventario
type Ubicacion = "Todas" | "Bodega Central" | "Farmacia" | "Quirófano";
type EstadoInventario = "Optimo" | "Bajo" | "Critico" | "Por Vencer";

export interface ProductoInventario {
  id: number;
  codigo: string;
  producto: string;
  categoria: string;
  stock: number;
  minimo: number;
  unidad: string;
  vencimiento: string;
  estado: EstadoInventario;
  ubicacion: Ubicacion;
}

interface KardexPanelProps {
  product: ProductoInventario | null;
  onClose: () => void;
}

// Datos simulados de movimientos (Solo para diseño)
const mockMovimientos = [
  { id: 1, fecha: "2026-09-15T10:30:00", tipo: "ENTRADA", doc: "REC-0912", detalle: "Recepción de Pedido", cant: 50, saldo: 120, usuario: "Dr. M. Ruiz" },
  { id: 2, fecha: "2026-09-14T14:15:00", tipo: "SALIDA", doc: "DES-0899", detalle: "Despacho a Quirófano", cant: 12, saldo: 70, usuario: "Ana López" },
  { id: 3, fecha: "2026-09-10T09:00:00", tipo: "SALIDA", doc: "DES-0885", detalle: "Despacho a Farmacia", cant: 30, saldo: 82, usuario: "Carlos V." },
  { id: 4, fecha: "2026-09-01T11:20:00", tipo: "ENTRADA", doc: "REC-0850", detalle: "Recepción de Pedido", cant: 100, saldo: 112, usuario: "Dr. M. Ruiz" },
  { id: 5, fecha: "2026-08-28T16:45:00", tipo: "SALIDA", doc: "AJU-0012", detalle: "Ajuste por merma (Quebrantamiento)", cant: 2, saldo: 12, usuario: "Admin" },
];

const KardexPanel: React.FC<KardexPanelProps> = ({ product, onClose }) => {
  const [isFullView, setIsFullView] = useState(false);

  if (!product) return null;

  // ==========================================
  // VISTA 1: DRAWER (KARDEX EXPRESS)
  // ==========================================
  if (!isFullView) {
    return (
      <div className="hidden lg:flex w-[400px] bg-white rounded-2xl shadow-[0_4px_25px_-5px_rgba(48,74,109,0.15)] border border-slate-100 flex-col min-h-0 animate-in slide-in-from-right-8 duration-300 z-40 relative">
        
        {/* Cabecera del Drawer */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start flex-shrink-0 bg-slate-50/50 rounded-t-2xl">
          <div>
            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-slate-200">
              {product.codigo}
            </span>
            <h3 className="text-lg font-bold text-[#304a6d] leading-tight pr-4">{product.producto}</h3>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-2">
              <MapPin size={13} className="text-sky-500"/> {product.ubicacion}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">
          
          {/* SECCIÓN: Lotes y Stock */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desglose de Lotes</h4>
              <span className="text-xs font-bold text-[#304a6d] bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                Total: {product.stock} {product.unidad}
              </span>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {/* Lote 1 */}
              <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-sky-300 transition-colors">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-700">Lote #LT-2024X</span>
                  <span className="text-[11px] text-orange-600 font-semibold flex items-center gap-1">
                    <Calendar size={11} /> Vence: {new Date(product.vencimiento).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-black text-[#304a6d] leading-none">{Math.floor(product.stock * 0.7)}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{product.unidad}</span>
                </div>
              </div>
              {/* Lote 2 */}
              <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-sky-300 transition-colors">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-700">Lote #LT-2025Y</span>
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Calendar size={11} /> Vence: Dic 2029
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-black text-[#304a6d] leading-none">{Math.ceil(product.stock * 0.3)}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{product.unidad}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN: Historial Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ArrowRightLeft size={14} /> Actividad Reciente
            </h4>
            
            <div className="relative border-l-2 border-slate-100 ml-2.5 pl-5 py-1 flex flex-col gap-6">
              {mockMovimientos.slice(0, 3).map((mov, __i) => (
                <div key={mov.id} className="relative group">
                  {/* Círculo indicador */}
                  <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${mov.tipo === 'ENTRADA' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[11px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      {new Date(mov.fecha).toLocaleDateString()}
                    </span>
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${mov.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {mov.tipo === 'ENTRADA' ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}
                      {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cant}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-700 font-semibold leading-snug">{mov.detalle}</p>
                  
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Por: {mov.usuario}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{mov.doc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer del Drawer */}
        <div className="p-4 border-t border-slate-100 bg-white flex rounded-b-2xl shadow-[0_-4px_10px_rgba(0,0,0,0.02)] relative z-10">
          <button 
            onClick={() => setIsFullView(true)}
            className="flex-1 bg-[#304a6d] hover:bg-[#233854] text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Maximize2 size={16} /> Ver Kardex Completo
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: MODAL (KARDEX COMPLETO)
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 text-[#304a6d]">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#304a6d] leading-tight">Kardex de Movimientos</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500 font-medium mt-0.5">
                <span className="font-mono">{product.codigo}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{product.producto}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="flex items-center gap-1 text-sky-600"><MapPin size={14}/> {product.ubicacion}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={16}/> Exportar
            </button>
            <button 
              onClick={() => setIsFullView(false)} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros del Kardex */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-4 flex-shrink-0">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar documento o detalle..." className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-500 transition-all shadow-sm" />
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Filter size={14} className="text-slate-400" />
            <select className="bg-transparent text-slate-700 text-sm outline-none cursor-pointer font-medium">
              <option value="todos">Todos los movimientos</option>
              <option value="entradas">Solo Entradas</option>
              <option value="salidas">Solo Salidas</option>
            </select>
          </div>

          <div className="ml-auto text-sm">
            <span className="text-slate-500 font-medium">Saldo Actual: </span>
            <span className="font-bold text-lg text-[#304a6d] ml-1">{product.stock} <span className="text-xs text-slate-400 font-normal">{product.unidad}</span></span>
          </div>
        </div>

        {/* Tabla de Movimientos (Diseño interno especializado para Kardex) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-2">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 rounded-tl-lg">Fecha</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Documento</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Detalle</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">Usuario</th>
                <th className="px-4 py-3 text-[11px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50/30 text-right">Entrada</th>
                <th className="px-4 py-3 text-[11px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50/30 text-right">Salida</th>
                <th className="px-4 py-3 text-[11px] font-bold text-[#304a6d] uppercase tracking-wider bg-blue-50/30 text-right rounded-tr-lg">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockMovimientos.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{new Date(mov.fecha).toLocaleDateString()} {new Date(mov.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-500 whitespace-nowrap">{mov.doc}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{mov.detalle}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{mov.usuario}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right bg-emerald-50/10">
                    {mov.tipo === 'ENTRADA' ? `+${mov.cant}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-rose-600 text-right bg-rose-50/10">
                    {mov.tipo === 'SALIDA' ? `-${mov.cant}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-[#304a6d] text-right bg-blue-50/10">
                    {mov.saldo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>
    </div>
  );
};

export default KardexPanel;