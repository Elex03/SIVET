import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, X, FileText } from "lucide-react";

interface DocumentUploaderProps {
  title?: string;
  description?: string;
  // Esta función emitirá el archivo al componente padre cuando necesites enviarlo al backend
  onFileSelect?: (file: File | null) => void; 
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  title = "Evidencia Documental", 
  description = "Sube una copia física de la factura o guía de remisión firmada (PDF/JPG).",
  onFileSelect
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiamos la memoria del navegador si el componente se desmonta o cambia el preview
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Manejar el archivo cuando se selecciona
  const handleFile = (file: File) => {
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);

    // Si es una imagen, generamos una URL local para mostrar la miniatura
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null); // Si es PDF, lo manejamos solo con ícono
    }
  };

  // Eventos de Drag & Drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Función para quitar el archivo
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se abra el explorador de archivos al dar clic en la X
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (onFileSelect) onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = ""; // Resetea el input
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex-1 min-h-[220px] flex flex-col">
      <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-xs text-slate-500 mb-4">{description}</p>
      
      {/* Input oculto nativo de HTML */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf, image/jpeg, image/png, image/jpg"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* RENDERIZADO CONDICIONAL: Si no hay archivo muestra la zona Drop, si hay muestra el Preview */}
      {!selectedFile ? (
        
        /* === ESTADO VACÍO: ZONA DE CARGA === */
        <div 
          className="flex-1 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 hover:bg-slate-50 hover:border-[#3b82f6] transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="w-12 h-12 bg-blue-50/50 text-[#3b82f6] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud size={22} />
          </div>
          <span className="text-sm font-medium text-slate-700 text-center">Arrastra tu archivo aquí</span>
          <span className="text-xs text-slate-400 mt-1">o haz clic para explorar</span>
        </div>

      ) : (

        /* === ESTADO LLENO: VISTA PREVIA === */
        <div className="flex-1 relative border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          
          {/* Botón flotante para eliminar el archivo */}
          <button 
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur shadow-sm hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors z-10"
            title="Quitar archivo"
          >
            <X size={16} />
          </button>

          {previewUrl ? (
            // Vista previa para IMÁGENES
            <div className="flex-1 bg-slate-50 relative flex items-center justify-center overflow-hidden h-32">
              <img 
                src={previewUrl} 
                alt="Vista previa" 
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            // Vista previa para PDF o Documentos
            <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-4">
              <FileText size={40} className="text-rose-400 mb-2 opacity-80" />
              <span className="text-sm font-medium text-slate-700 text-center line-clamp-1 break-all px-4" title={selectedFile.name}>
                {selectedFile.name}
              </span>
            </div>
          )}
          
          {/* Footer de la tarjeta de vista previa */}
          <div className="bg-white border-t border-slate-100 px-4 py-3 flex justify-between items-center flex-shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento adjunto</span>
              <span className="text-xs text-slate-500 font-medium">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB {/* Convierte bytes a Megabytes */}
              </span>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-[#3b82f6] hover:text-blue-700 transition-colors"
            >
              Cambiar
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default DocumentUploader;