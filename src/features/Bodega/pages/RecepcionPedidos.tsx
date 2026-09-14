import React, { useState, useRef, useEffect } from "react";
import { 
  Search, Plus, Trash2, UploadCloud, 
  Save, CheckCircle, XCircle, FileText, Package
} from "lucide-react";
import PageHeader from "../../../shared/components/Layout/PageHeader";

// ==============================================================
// 1. CATÁLOGO SIMULADO (Base de datos de prueba)
// ==============================================================
const CATALOGO_PRUEBA = [
  { codigo: "MED-001", nombre: "Oxitetraciclina 20%", presentacion: "Frasco de 100ml", unidad: "Frascos" },
  { codigo: "MED-005", nombre: "Amoxicilina 500mg", presentacion: "Caja x 50 tabletas", unidad: "Cajas" },
  { codigo: "MED-012", nombre: "Ibuprofeno 400mg", presentacion: "Caja x 100 tabletas", unidad: "Cajas" },
  { codigo: "INS-001", nombre: "Jeringa 5ml", presentacion: "Caja x 100 unidades", unidad: "Cajas" },
  { codigo: "MED-020", nombre: "Paracetamol 500mg", presentacion: "Caja x 20 tabletas", unidad: "Cajas" },
  { codigo: "MED-033", nombre: "Prednisona 50mg", presentacion: "Caja x 30 tabletas", unidad: "Cajas" },
];

const RecepcionPedidos: React.FC = () => {
  const [productos, setProductos] = useState<any[]>([]);
  
  // Estados para el buscador predictivo
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(CATALOGO_PRUEBA);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ==============================================================
  // 2. LÓGICA DEL BUSCADOR PREDICTIVO
  // ==============================================================
  
  // Manejar lo que el usuario escribe
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === "") {
      setFilteredOptions([]);
      setIsDropdownOpen(false);
    } else {
      const termino = value.toLowerCase();
      const filtrados = CATALOGO_PRUEBA.filter(
        (p) => 
          p.nombre.toLowerCase().includes(termino) || 
          p.codigo.toLowerCase().includes(termino)
      );
      setFilteredOptions(filtrados);
      setIsDropdownOpen(true);
    }
  };

  // Al seleccionar un item de la lista desplegable
  const handleSelectItem = (producto: any) => {
    setProductos([
      ...productos,
      { 
        ...producto, 
        id: Date.now() + Math.random(), // ID único por si agregan 2 lotes del mismo producto
        lote: "", 
        caducidad: "", 
        cantidad: "" 
      }
    ]);
    setSearchTerm(""); // Limpia el buscador
    setIsDropdownOpen(false); // Cierra la lista
  };

  // Cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ==============================================================
  // 3. FUNCIÓN: QUITAR DE LA TABLA
  // ==============================================================
  const handleRemoveProduct = (idToRemove: number) => {
    setProductos(productos.filter((prod) => prod.id !== idToRemove));
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col h-full">
      <PageHeader 
        header="Recepción de Pedidos" 
        sub="Registra el ingreso de medicamentos y suministros verificando facturas, lotes y caducidades." 
      />

      <div className="flex flex-col xl:flex-row gap-8 w-full flex-1 min-h-0">
        
        {/* ============================================================== */}
        {/* COLUMNA IZQUIERDA (70%) */}
        {/* ============================================================== */}
        <div className="flex-[7] flex flex-col min-w-0 gap-6">
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-[#304a6d] mb-4 flex items-center gap-2">
              <FileText size={18} /> Información de la Factura / Orden
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Proveedor</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-colors cursor-pointer">
                  <option value="">Seleccione proveedor...</option>
                  <option value="1">Distribuidora Médica S.A.</option>
                  <option value="2">Laboratorios PharmaVet</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">No. Documento</label>
                <input type="text" placeholder="Ej. FAC-99012" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fecha de Recepción</label>
                <input type="date" defaultValue="2026-09-14" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Responsable</label>
                <input type="text" value="Dr. J. Pérez (Tú)" disabled className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Bloque 2: Buscador Autocompletado */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {/* Contenedor relativo para el Dropdown */}
            <div className="relative flex-1 w-full max-w-xl" ref={dropdownRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => { if(searchTerm) setIsDropdownOpen(true) }}
                placeholder="Busca por nombre o código (Ej. Jeringa, Paracetamol)..." 
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm shadow-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all" 
              />
              
              {/* Menú Flotante de Resultados */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                  {filteredOptions.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {filteredOptions.map((item, index) => (
                        <li 
                          key={index}
                          onClick={() => handleSelectItem(item)}
                          className="px-4 py-3 hover:bg-blue-50/50 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                            <Package size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">{item.nombre}</span>
                            <span className="text-xs text-gray-500">{item.codigo} • {item.presentacion}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      No se encontraron resultados para "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm flex-shrink-0">
              <Plus size={16} className="text-blue-500" />
              <span>Nuevo Producto</span>
            </button>
          </div>

          {/* Bloque 3: Tabla Dinámica de Captura */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-[300px] z-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-12">Img</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">Código</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Medicamento y Presentación</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-36">Lote *</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">Vencimiento *</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">Cant *</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right w-16">Acc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productos.length > 0 ? (
                    productos.map((prod) => (
                      <tr key={prod.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-4 py-2">
                          <div className="w-9 h-9 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400 overflow-hidden">
                            <span>Img</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 font-mono">{prod.codigo}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800 leading-tight">{prod.nombre}</span>
                            <span className="text-[11px] text-gray-500 mt-0.5">{prod.presentacion}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" placeholder="Ej. L-123" className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="date" className="w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 text-sm text-gray-600 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-4 py-2">
                          <div className="relative flex items-center">
                            <input 
                              type="number" 
                              placeholder="0" 
                              min="1" 
                              className="w-full bg-white border border-gray-200 rounded-md pl-2 pr-14 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" 
                            />
                            <span className="absolute right-2 text-[10px] font-semibold text-gray-400 uppercase pointer-events-none">
                              {prod.unidad}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button 
                            onClick={() => handleRemoveProduct(prod.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" 
                            title="Eliminar fila"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                        Busca un producto en la barra superior para agregarlo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {productos.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-100 p-3 text-xs text-gray-500 text-right pr-6">
                Total líneas ingresadas: <strong className="text-gray-800">{productos.length}</strong>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMNA DERECHA (30%) */}
        {/* ============================================================== */}
        <div className="w-full xl:w-[320px] 2xl:w-[380px] flex flex-col gap-6 flex-shrink-0">
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[#304a6d]">Resumen</h3>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                ⏳ En Progreso
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tipos de productos:</span>
                <span className="font-semibold text-gray-800">{productos.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total unidades físicas:</span>
                <span className="font-semibold text-[#3b82f6]">0</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex-1 min-h-[200px] flex flex-col">
            <h3 className="font-semibold text-[#304a6d] mb-3">Evidencia Documental</h3>
            <p className="text-xs text-gray-500 mb-4">Sube una copia física de la factura o guía de remisión firmada (PDF/JPG).</p>
            
            <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 hover:bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">Arrastra tu archivo aquí</span>
              <span className="text-xs text-gray-400 mt-1">o haz clic para explorar</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <button 
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm ${
                productos.length > 0 ? "bg-[#3b82f6] hover:bg-blue-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle size={18} /> Confirmar Recepción
            </button>
            
            <div className="flex gap-3">
              <button className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Save size={16} /> Guardar 
              </button>
              <button 
                onClick={() => setProductos([])} 
                className="flex-1 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> Cancelar
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RecepcionPedidos;