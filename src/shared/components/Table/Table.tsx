import React from "react";
import { Eye, Edit2 } from "lucide-react";

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
}

const Table: React.FC<TableProps> = ({ columns, data, onView, onEdit }) => {
  const hasActions = Boolean(onView || onEdit);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              {columns.map((col) => (
                <th key={col.id} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {/* Si la columna tiene una función render, la usa; si no, imprime el texto normal */}
                      {col.render ? col.render(row) : row[col.id]}
                    </td>
                  ))}
                  
                  {hasActions && (
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <button onClick={() => onView(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Ver detalles">
                            <Eye size={16} />
                          </button>
                        )}
                        {onEdit && (
                          <button onClick={() => onEdit(row)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Editar">
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No hay datos disponibles para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;