import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = "max-w-3xl" // Actualizado a 3xl por defecto para tablas
}) => {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      
      {/* Overlay con desenfoque acorde a la línea gráfica */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Contenedor principal con los mismos bordes y sombras de las tarjetas */}
      <div 
        className={`relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full ${maxWidth} flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10`}
      >
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-start px-6 py-5 border-b border-gray-100 bg-white flex-shrink-0">
          <div>
            <h2 className="text-[1.15rem] font-semibold text-[#304a6d] leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            title="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido con padding espacioso */}
        <div className="overflow-y-auto px-6 py-5 bg-white flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;