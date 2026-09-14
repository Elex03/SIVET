import React from "react";

interface ActivityItemProps {
  icon: React.ReactNode;
  time: string;
  description: string;
  variant?: "success" | "warning" | "error" | "info";
  isLast?: boolean; 
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
  icon, 
  time, 
  description, 
  variant = "info",
  isLast = false 
}) => {
  const colors = {
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-600",
    error: "bg-red-100 text-red-600",
    info: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="flex gap-3 relative">
      {/* Línea conectora vertical (se oculta en el último elemento) */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-gray-100 z-0"></div>
      )}
      
      {/* Círculo con Ícono */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${colors[variant]}`}>
        {icon}
      </div>
      
      {/* Contenido (Fecha y Descripción) */}
      <div className="flex flex-col pb-5">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{time}</span>
        <span className="text-sm text-gray-700 mt-0.5 leading-snug">{description}</span>
      </div>
    </div>
  );
};

export default ActivityItem;