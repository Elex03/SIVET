import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save, CheckCircle, XCircle, FileText } from "lucide-react";

import PageHeader from "../../../shared/components/Layout/PageHeader";
import DocumentUploader from "../components/DocumentUploader";
import ProductSearch from "../../../shared/components/inputs/ProductSearch";
import ReceptionTable from "../components/ReceptionTable"; 

import ModalMedicamento from "../../Catalogos/components/ModalMedicamento"; 

import type { ProductItem } from "../../../shared/components/inputs/ProductSearch";
import type { ReceptionProduct } from "../components/ReceptionTable";

// CATÁLOGO BASADO EN TU EXCEL DE EJEMPLO
const CATALOGO_PRUEBA: ProductItem[] = [
  { codigo: "MED-001", nombre: "INADRIM ACEPROMACINA MALEATO 1%", marca: "RICHMOND VET PHARMA", presentacion: "FRASCO", unidad: "ML" },
  { codigo: "MED-002", nombre: "MIDAZOLAM 5MG", marca: "RICHMOND VET PHARMA", presentacion: "FRASCO", unidad: "ML" },
  { codigo: "MED-003", nombre: "FRIPETS", marca: "MONTANA", presentacion: "CAJAS", unidad: "TAB" },
  { codigo: "MED-004", nombre: "ZOOSARNI", marca: "BIOZOO", presentacion: "FRASCO", unidad: "G" },
  { codigo: "MED-005", nombre: "PANAWELL FEBENDAZOL", marca: "WELLCO", presentacion: "BOTELLAS", unidad: "ML" },
  { codigo: "MED-006", nombre: "FLU- HIOTEX", marca: "QUIMVETSA", presentacion: "CAJAS", unidad: "G" },
];

const RecepcionPedidos: React.FC = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<ReceptionProduct[]>([]);
  
  // ==========================================
  // ESTADO PARA EL MODAL DE NUEVO PRODUCTO
  // ==========================================
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función al seleccionar un producto del buscador
  const handleSelectProduct = (item: ProductItem) => {
    const nuevoProducto: ReceptionProduct = {
      id: Date.now() + Math.random(),
      codigo: item.codigo,
      nombre: item.nombre,
      marca: item.marca || "GENÉRICO",
      lote: "",
      caducidad: "",
      
      cantidad: "",
      unidad_medida: item.presentacion || "CAJAS", 
      uxe_cantidad: "",
      uxe_unidad: item.unidad || "TAB",
    };

    setProductos((prev) => [...prev, nuevoProducto]);
  };

  const handleRemoveProduct = (idToRemove: number) => {
    setProductos((prev) => prev.filter((prod) => prod.id !== idToRemove));
  };

  const handleFieldChange = (id: number, field: keyof ReceptionProduct, value: string | number) => {
    setProductos((prev) =>
      prev.map((prod) => (prod.id === id ? { ...prod, [field]: value } : prod))
    );
  };

  // Cálculo del total para el panel de resumen
  const calcularUnidadesTotales = () => {
    return productos.reduce((acc, curr) => {
      const totalLinea = (Number(curr.cantidad) || 0) * (Number(curr.uxe_cantidad) || 0);
      return acc + totalLinea;
    }, 0);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-2rem)] pb-4 relative">
      <PageHeader
        header="Recepción de Pedidos"
        sub="Registra el ingreso verificando presentación, UXE y caducidad del producto."
      />

      <div className="flex flex-col xl:flex-row gap-6 w-full flex-1 min-h-0">
        
        {/* COLUMNA IZQUIERDA (70%) */}
        <div className="flex-[7] flex flex-col min-w-0 gap-4 h-full">
          
          {/* INFORMACIÓN DE LA FACTURA */}
          <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex-shrink-0">
            <h3 className="text-sm font-semibold text-[#304a6d] mb-3 flex items-center gap-2">
              <FileText size={18} /> Información de la Factura / Orden
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Proveedor</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-colors cursor-pointer">
                  <option value="">Seleccione proveedor...</option>
                  <option value="1">Distribuidora Médica S.A.</option>
                  <option value="2">Laboratorios PharmaVet</option>
                  <option value="3">Montana / Biozoo</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">No. Documento</label>
                <input type="text" placeholder="Ej. FAC-99012" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha</label>
                <input type="date" defaultValue="2026-09-14" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Responsable</label>
                <input type="text" value="Dr. J. Pérez (Tú)" disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-500 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* BUSCADOR Y BOTÓN NUEVO PRODUCTO */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0">
            <ProductSearch
              catalog={CATALOGO_PRUEBA}
              onSelect={handleSelectProduct}
            />

            {/* AQUI CONECTAMOS EL BOTÓN CON EL ESTADO DEL MODAL */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm flex-shrink-0"
            >
              <Plus size={16} className="text-[#3b82f6]" />
              <span>Nuevo Producto</span>
            </button>
          </div>

          {/* TABLA DE RECEPCIÓN */}
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden">
            <ReceptionTable 
              productos={productos}
              onRemove={handleRemoveProduct}
              onChange={handleFieldChange}
            />
          </div>
          
        </div>

        {/* COLUMNA DERECHA (30%) - RESUMEN */}
        <div className="w-full xl:w-[320px] 2xl:w-[380px] flex flex-col gap-4 flex-shrink-0">
          
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-[#304a6d]">Resumen de Ingreso</h3>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                ⏳ Borrador
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-500">Líneas de productos:</span>
                <span className="font-semibold text-slate-800">{productos.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Unidades Totales Base:</span>
                <span className="text-lg font-bold text-[#3b82f6]">
                  {calcularUnidadesTotales()}
                </span>
              </div>
            </div>
          </div>

          <DocumentUploader
            title="Evidencia Documental"
            description="Sube copia de factura o remisión firmada."
            onFileSelect={(file) => console.log("Archivo listo para subir:", file)}
          />

          <div className="flex flex-col gap-3 mt-auto">
            <button
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm ${
                productos.length > 0
                  ? "bg-[#3b82f6] hover:bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
              disabled={productos.length === 0}
            >
              <CheckCircle size= {18} /> Confirmar Recepción
            </button>

            <div className="flex gap-3">
              <button className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Save size={16} /> Guardar
              </button>
              <button
                onClick={() => navigate("/bodega/pedidos")}
                className="flex-1 text-red-500 bg-white border border-red-100 hover:bg-red-50 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <XCircle size={16} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* RENDERIZADO DEL MODAL */}
      {/* ========================================== */}
      <ModalMedicamento 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

    </div>
  );
};

export default RecepcionPedidos;