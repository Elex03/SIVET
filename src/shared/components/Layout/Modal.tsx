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
  const description = useId();
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
        const focusable = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || [])].filter(element => element.getClientRects().length > 0);
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
    <div className="modal-layer fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
      
      {/* Overlay con desenfoque acorde a la línea gráfica */}
      <div 
        className="modal-backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true"
        onClick={onClose}
      ></div>
      
      {/* Contenedor principal con los mismos bordes y sombras de las tarjetas */}
      <div 
        ref={panel} role="dialog" aria-modal="true" aria-labelledby={heading} aria-describedby={subtitle ? description : undefined} tabIndex={-1}
        className={`modal-panel relative bg-white rounded-3xl shadow-xl w-full ${maxWidth} flex flex-col max-h-[94dvh] overflow-hidden z-10`}
      >
        {/* Cabecera del Modal */}
        <div className="modal-heading flex justify-between items-start gap-4 px-5 sm:px-7 py-5 sm:py-6 flex-shrink-0">
          <div>
            <h2 id={heading} className="text-[1.15rem] font-semibold text-[#304a6d] leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p id={description} className="text-sm text-gray-500 mt-2 leading-relaxed">
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
        <div className="modal-body overflow-y-auto px-5 sm:px-7 py-5 sm:py-6 bg-white flex-1 min-h-0 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
