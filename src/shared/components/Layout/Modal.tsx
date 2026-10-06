import React, { useEffect, useId, useRef } from "react";
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
  const panel = useRef<HTMLDivElement>(null);
  const heading = useId();
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const overflow = document.body.style.overflow;
      const previous = document.activeElement as HTMLElement | null;
      const handleKey = (event: KeyboardEvent) => {
        const dialogs = document.querySelectorAll('[role="dialog"]');
        if (dialogs[dialogs.length - 1] !== panel.current) return;
        if (event.key === 'Escape') close.current();
        if (event.key !== 'Tab') return;
        const focusable = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]');
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      };
      document.body.style.overflow = "hidden";
      panel.current?.focus();
      document.addEventListener('keydown', handleKey);
      return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', handleKey); previous?.focus(); };
    }
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
        ref={panel} role="dialog" aria-modal="true" aria-labelledby={heading} tabIndex={-1}
        className={`relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full ${maxWidth} flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10`}
      >
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-start px-6 py-5 border-b border-gray-100 bg-white flex-shrink-0">
          <div>
            <h2 id={heading} className="text-[1.15rem] font-semibold text-[#304a6d] leading-tight">
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
