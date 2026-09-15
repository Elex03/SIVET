import React, { useState, useEffect, useRef } from "react";
import { 
  Eye, Edit2, Download, 
  ChevronLeft, ChevronRight, 
  FileText, FileSpreadsheet, Inbox,
  MoreVertical
} from "lucide-react";

// Importamos nuestras utilidades
import { generatePDFTemplate, generateExcel } from "../../utils/printUtils";

export interface TableColumn {
  id: string;
  label: string;
  render?: (row: any) => React.ReactNode; 
}

interface TableProps {
  columns: TableColumn[];
  data: Record<string, any>[];
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDownload?: (row: any) => void;
  
  // Exportación interna
  enableExport?: boolean;
  exportTitle?: string;
  exportSubtitle?: string;
}

const Table: React.FC<TableProps> = ({ 
  columns, 
  data, 
  onView, 
  onEdit, 
  onDownload,
  enableExport = true,
  exportTitle = "Reporte General",
  exportSubtitle = "Listado de registros del sistema"
}) => {
  const hasActions = Boolean(onView || onEdit || onDownload);

  // ==========================================
  // ESTADOS DE PAGINACIÓN
  // ==========================================
  const [currentPage, setCurrentPage] = useState(1);
  // Cambiamos el tipo para que acepte número o el string "all"
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, itemsPerPage]);

  // Si itemsPerPage es "all", el total de elementos por página es la longitud total de la data
  const effectiveItemsPerPage = itemsPerPage === "all" ? (data.length > 0 ? data.length : 1) : itemsPerPage;
  const totalPages = Math.ceil(data.length / effectiveItemsPerPage);
  
  const startIndex = (currentPage - 1) * effectiveItemsPerPage;
  const endIndex = itemsPerPage === "all" ? data.length : startIndex + effectiveItemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // ==========================================
  // ESTADOS DEL MENÚ HAMBURGUESA Y EXPORTACIÓN
  // ==========================================
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const menuRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getExportData = () => {
    const exportColumns = columns.map(c => c.label);
    const exportRows = data.map(row => 
      columns.map(c => row[c.id] || "")
    );
    return { columns: exportColumns, data: exportRows };
  };

  const handleExportPDF = () => {
    const { columns: exportCols, data: exportRows } = getExportData();
    generatePDFTemplate({
      title: exportTitle,
      subtitle: exportSubtitle,
      columns: exportCols,
      data: exportRows
    });
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const { columns: exportCols, data: exportRows } = getExportData();
    generateExcel({
      title: exportTitle,
      columns: exportCols,
      data: exportRows
    });
    setIsExportMenuOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex-1 flex flex-col min-h-0 relative">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {columns.map((col) => (
                <th key={col.id} className="px-5 py-4 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              
              {hasActions && (
                <th className="px-5 py-4 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  Acciones
                </th>
              )}

              {enableExport && (
                <th ref={menuRef} className="px-3 py-4 w-12 text-center relative">
                  <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className={`p-1.5 rounded-lg transition-all ${isExportMenuOpen ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}
                    title="Opciones de exportación"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {isExportMenuOpen && (
                    <div className="absolute right-6 top-full mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150 text-left font-normal">
                      <button 
                        onClick={handleExportExcel}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition-colors"
                      >
                        <FileSpreadsheet size={16} className="text-emerald-500" /> 
                        Exportar Excel
                      </button>
                      <button 
                        onClick={handleExportPDF}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-3 transition-colors"
                      >
                        <FileText size={16} className="text-rose-500" /> 
                        Exportar PDF
                      </button>
                    </div>
                  )}
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100/80">
            {currentData.length > 0 ? (
              currentData.map((row, index) => (
                <tr key={row.id || index} className="group hover:bg-slate-50/60 transition-colors">
                  {columns.map((col) => (
                    <td key={col.id} className="px-5 py-4 text-sm text-slate-600 group-hover:text-slate-900 whitespace-nowrap transition-colors">
                      {col.render ? col.render(row) : row[col.id]}
                    </td>
                  ))}
                  
                  {hasActions && (
                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        {onView && (
                          <button onClick={() => onView(row)} className="p-1.5 text-slate-400 hover:text-[#3b82f6] hover:bg-blue-50 rounded-lg transition-all" title="Ver detalles">
                            <Eye size={17} />
                          </button>
                        )}
                        {onEdit && (
                          <button onClick={() => onEdit(row)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Editar">
                            <Edit2 size={17} />
                          </button>
                        )}
                        {onDownload && (
                          <button onClick={() => onDownload(row)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Descargar Adjunto">
                            <Download size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}

                  {enableExport && <td className="px-3 py-3 whitespace-nowrap"></td>}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0) + (enableExport ? 1 : 0)} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <Inbox size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No se encontraron registros</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-slate-100 bg-white gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Mostrar</span>
          <select 
            value={itemsPerPage}
            // Parseamos a número si no es "all"
            onChange={(e) => setItemsPerPage(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#3b82f6] text-slate-700 cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value="all">Todos</option> {/* <--- OPCIÓN AÑADIDA AQUÍ */}
          </select>
          <span>registros</span>
        </div>

        <div className="flex items-center gap-5">
          <span className="text-sm text-slate-500">
            Página <strong className="text-slate-800 font-semibold">{currentPage}</strong> de <strong className="text-slate-800 font-semibold">{totalPages || 1}</strong>
          </span>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;