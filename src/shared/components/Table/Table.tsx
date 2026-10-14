import StatusBadge from './StatusBadge';
import React, { useState, useEffect, useRef } from "react";
import {
  Eye, Edit2, Download,
  ChevronLeft, ChevronRight,
  FileText, FileSpreadsheet, Inbox,
  MoreVertical, Check, Columns
} from "lucide-react";

import { generatePDFTemplate, generateExcel } from "../../utils/printUtils";

export interface TableColumn {
  id: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  pageSize?: number;
  data: Record<string, any>[];
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDownload?: (row: any) => void;
  enableExport?: boolean;
  exportTitle?: string;
  exportSubtitle?: string;
}

const Table: React.FC<TableProps> = ({
  columns,
  pageSize = 10,
  data,
  onView,
  onEdit,
  onDownload,
  enableExport = true,
  exportTitle = "Reporte General",
  exportSubtitle = "Listado de registros del sistema"
}) => {
  const hasActions = Boolean(onView || onEdit || onDownload);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resize = useRef<{ id: string; x: number; width: number } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const measureColumns = () => Object.fromEntries(
    [...(tableRef.current?.querySelectorAll<HTMLElement>('th[data-column]') || [])]
      .map(cell => [cell.dataset.column!, cell.getBoundingClientRect().width])
  );
  const setWidth = (id: string, width: number) => setColumnWidths(previous => ({ ...previous, [id]: Math.max(80, Math.min(640, Math.round(width))) }));

  // ==========================================
  // ESTADO DE VISIBILIDAD DE COLUMNAS
  // ==========================================
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const visibleColumns = columns.map(col => col.id).filter(id => !hiddenColumns.includes(id));

  const toggleColumn = (colId: string) => {
    setHiddenColumns(prev =>
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  const activeColumnsForTable = columns.filter(col => visibleColumns.includes(col.id));

  // ==========================================
  // ESTADOS DE PAGINACIÓN
  // ==========================================
  const [requestedPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(pageSize);


  const effectiveItemsPerPage = itemsPerPage === "all" ? (data.length > 0 ? data.length : 1) : itemsPerPage;
  const totalPages = Math.ceil(data.length / effectiveItemsPerPage);
  const currentPage = Math.min(requestedPage, Math.max(1, totalPages));

  const startIndex = (currentPage - 1) * effectiveItemsPerPage;
  const endIndex = itemsPerPage === "all" ? data.length : startIndex + effectiveItemsPerPage;
  const [sort, setSort] = useState<{ key: string; descending: boolean } | null>(null);
  const sortedData = [...data].sort((a, b) => {
    if (!sort) return 0;
    const value = (row: Record<string, any>) => {
      const raw = row[sort.key];
      if (/fecha|vencimiento/i.test(sort.key) && typeof raw === 'string') {
        const local = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
        if (local) { let hour = Number(local[4] || 0); if (/[ap]\.?(?:\s*)m/i.test(raw)) hour = hour % 12 + (/p\.?(?:\s*)m/i.test(raw) ? 12 : 0); return Date.UTC(+local[3], +local[2]-1, +local[1], hour, +(local[5] || 0), +(local[6] || 0)); }
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return Date.parse(raw);
      }
      return raw;
    };
    const av = value(a), bv = value(b);
    const delta = av == null ? (bv == null ? 0 : 1) : bv == null ? -1 : typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'es', { numeric: true, sensitivity: 'base' });
    return sort.descending ? -delta : delta;
  });
  const currentData = sortedData.slice(startIndex, endIndex);

  // ==========================================
  // ESTADOS DEL MENÚ
  // ==========================================
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getExportData = () => {
    const exportColumns = activeColumnsForTable.filter(c => c.id !== 'imagen').map(c => c.label);
    const exportRows = sortedData.map(row =>
      activeColumnsForTable.filter(c => c.id !== 'imagen').map(c => Array.isArray(row[c.id]) ? row[c.id].join(', ') : row[c.id] ?? "")
    );
    return { columns: exportColumns, data: exportRows };
  };

  const handleExportPDF = () => {
    generatePDFTemplate({ title: exportTitle, subtitle: exportSubtitle, columns: getExportData().columns, data: getExportData().data });
    setIsMenuOpen(false);
  };

  const handleExportExcel = () => {
    generateExcel({ title: exportTitle, columns: getExportData().columns, data: getExportData().data });
    setIsMenuOpen(false);
  };

  return (
    <div className="data-table bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex-1 flex flex-col min-h-0 relative overflow-hidden">

      {/* CONTENEDOR HORIZONTAL (Controla el overflow si hay demasiadas columnas) */}
      <div tabIndex={0} role="region" aria-label={`Tabla: ${exportTitle}`} className="table-scroll w-full flex-1 min-h-0 overflow-auto custom-scrollbar">

        {/* LA TABLA AHORA ES UN FLEX CONTAINER PARA QUE EL TBODY SE ESTIRE */}
        <table ref={tableRef} className="w-full table-auto border-collapse text-left" style={Object.keys(columnWidths).length ? { tableLayout: 'fixed', width: activeColumnsForTable.reduce((sum, col) => sum + (columnWidths[col.id] || 140), 0) + (hasActions ? 112 : 0) + (enableExport ? 56 : 0), minWidth: '100%' } : undefined}>
          {Object.keys(columnWidths).length > 0 && <colgroup>{activeColumnsForTable.map(col => <col key={col.id} style={{ width: columnWidths[col.id] || 140 }} />)}{hasActions && <col style={{width:112}} />}{enableExport && <col style={{width:56}} />}</colgroup>}

          {/* THEAD: Estático, fuera del scroll vertical.
              El pr-[6px] compensa visualmente el ancho del scrollbar que tendrá el tbody */}
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="w-full">

              {activeColumnsForTable.map((col) => (
                <th key={col.id} data-column={col.id} aria-sort={sort?.key === col.id ? sort.descending ? "descending" : "ascending" : "none"} className="relative px-3 py-3 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider whitespace-normal">
                  <button type="button" className="flex items-center gap-2 text-left w-full" aria-label={'Ordenar ' + col.label + (sort?.key === col.id && !sort.descending ? ' descendente' : ' ascendente')} onClick={() => { setSort({ key: col.id, descending: sort?.key === col.id ? !sort.descending : false }); setCurrentPage(1); }}>{col.label}<span aria-hidden="true">{sort?.key === col.id ? sort.descending ? '↓' : '↑' : '↕'}</span></button>
                  <span role="separator" tabIndex={0} aria-orientation="vertical" aria-label={`Ancho de ${col.label}`} aria-valuemin={80} aria-valuemax={640} aria-valuenow={Math.round(columnWidths[col.id] || 140)} className="column-resizer" title="Arrastra para ajustar. Flechas para cambiar el ancho. Doble clic para restablecer."
                    onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); const measured = measureColumns(); setColumnWidths(measured); resize.current = {id:col.id,x:event.clientX,width:measured[col.id] || 140}; event.currentTarget.setPointerCapture(event.pointerId); }}
                    onPointerMove={event => { const active = resize.current; if (active?.id === col.id) setWidth(col.id, active.width + event.clientX - active.x); }}
                    onPointerUp={event => { resize.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
                    onPointerCancel={() => { resize.current = null; }} onLostPointerCapture={() => { resize.current = null; }}
                    onDoubleClick={() => setColumnWidths({})}
                    onKeyDown={event => { if (!['ArrowLeft','ArrowRight','Home'].includes(event.key)) return; event.preventDefault(); if (event.key === 'Home') {setColumnWidths({});return;} const measured = measureColumns(); setColumnWidths(measured); setWidth(col.id,(measured[col.id] || 140) + (event.key === 'ArrowRight' ? 16 : -16)); }} />
                </th>
              ))}

              {hasActions && (
                <th className="w-28 px-5 py-4 text-[11.5px] font-bold text-slate-500 uppercase tracking-wider text-right flex-shrink-0">
                  Acciones
                </th>
              )}

              {enableExport && (
                <th ref={menuRef} className="w-14 px-3 py-4 text-center relative flex-shrink-0">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-1.5 rounded-lg transition-all ${isMenuOpen ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}
                    title="Opciones de Tabla"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* MENÚ CASCADA (Exportar y Columnas) */}
                  {isMenuOpen && (
                    <div className="absolute right-6 top-full mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1)] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 text-left font-normal">

                      <div className="relative group">
                        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-2.5">
                            <Download size={15} className="text-slate-400" />
                            <span>Exportar...</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <div className="absolute right-[98%] top-0 mr-1 w-48 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1)] py-1.5 hidden group-hover:block animate-in fade-in slide-in-from-right-2 duration-150">
                          <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition-colors">
                            <FileSpreadsheet size={15} className="text-emerald-500" /> Exportar Excel
                          </button>
                          <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-3 transition-colors">
                            <FileText size={15} className="text-rose-500" /> Exportar PDF
                          </button>
                        </div>
                      </div>

                      <div className="my-1 border-t border-slate-100"></div>

                      <div className="relative group">
                        <button className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-2.5">
                            <Columns size={15} className="text-slate-400" />
                            <span>Ver columnas...</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <div className="absolute right-[98%] top-0 mr-1 w-52 bg-white border border-slate-100 rounded-xl shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1)] py-2 hidden group-hover:block animate-in fade-in slide-in-from-right-2 duration-150">
                          <div className="px-4 pb-2 mb-1 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Seleccionar Visibles
                          </div>
                          <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col">
                            {columns.map(col => (
                              <label key={col.id} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors group/item">
                                <div className="relative flex items-center justify-center w-3.5 h-3.5 border-2 border-slate-300 rounded-[4px] group-hover/item:border-[#3b82f6] transition-colors">
                                  <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={visibleColumns.includes(col.id)}
                                    onChange={() => toggleColumn(col.id)}
                                  />
                                  <div className="w-3.5 h-3.5 rounded-[4px] peer-checked:bg-[#3b82f6] peer-checked:border-[#3b82f6] absolute flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-all">
                                    <Check size={10} className="text-white" strokeWidth={4} />
                                  </div>
                                </div>
                                <span className="text-[13px] font-medium text-slate-700">{col.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </th>
              )}
            </tr>
          </thead>

          {/* TBODY: Flex-1 y Block. ESTE es el único elemento que hará scroll vertical */}
          <tbody className="divide-y divide-slate-100/80 bg-white">
            {currentData.length > 0 ? (
              currentData.map((row, index) => (
                <tr key={row.id || index} className="group/row hover:bg-slate-50/60 transition-colors">

                  {activeColumnsForTable.map((col) => (
                    <td key={col.id} className="px-3 py-3 text-sm text-slate-600 group-hover/row:text-slate-900 break-words">
                      {col.id === 'estado' ? <StatusBadge value={row[col.id]} /> : col.render ? col.render(row) : row[col.id]}
                    </td>
                  ))}

                  {hasActions && (
                    <td className="w-28 px-5 py-3 text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover/row:opacity-100 transition-opacity">
                        {onView && (
                          <button data-tour-open="detail" data-tour-purpose={row.guidePurpose} onClick={() => onView(row)} className="p-1.5 text-slate-400 hover:text-[#3b82f6] hover:bg-blue-50 rounded-lg transition-all" title="Ver detalles">
                            <Eye size={17} />
                          </button>
                        )}
                        {onEdit && (
                          <button data-tour-open="edit" onClick={() => onEdit(row)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Editar">
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

                  {enableExport && (
                    <td className="w-14 px-3 py-3 flex-shrink-0"></td>
                  )}
                </tr>
              ))
            ) : (
              <tr >
                <td colSpan={activeColumnsForTable.length + Number(hasActions) + Number(enableExport)} className="py-16 text-center border-none">
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

      {/* FOOTER ESTÁTICO (Nunca se oculta ni scrollea) */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-slate-100 bg-white gap-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(e.target.value === "all" ? "all" : Number(e.target.value)); setCurrentPage(1); }}
            className="border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#3b82f6] text-slate-700 cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={8}>8</option><option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value="all">Todos</option>
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
