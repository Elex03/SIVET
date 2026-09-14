import React from "react";
import {  TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trendValue?: string;
  trendText?: string;
  trendType?: "up" | "down" | "neutral";
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon: Icon,
  trendValue,
  trendText = "vs mes anterior",
  trendType = "neutral",
}) => {
  // Determinamos los colores de la tendencia según el tipo
  const trendColors = {
    up: "text-emerald-600 bg-emerald-50",
    down: "text-rose-600 bg-rose-50",
    neutral: "text-gray-600 bg-gray-50",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      
      {/* Título e Ícono (Discreto a la derecha) */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-semibold text-gray-500 pr-2 leading-tight">
          {title}
        </span>
        <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg flex-shrink-0">
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>

      {/* Valor Principal */}
      <div>
        <span className="text-3xl font-bold text-gray-800 tracking-tight">
          {value}
        </span>
      </div>

      {/* Indicador de Tendencia (Bottom) */}
      {trendValue && (
        <div className="mt-4 flex items-center gap-1.5 text-[11px] sm:text-xs">
          <span
            className={`flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-md ${trendColors[trendType]}`}
          >
            {trendType === "up" && <TrendingUp size={12} strokeWidth={3} />}
            {trendType === "down" && <TrendingDown size={12} strokeWidth={3} />}
            {trendType === "neutral" && <Minus size={12} strokeWidth={3} />}
            {trendValue}
          </span>
          <span className="text-gray-400 font-medium truncate">
            {trendText}
          </span>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;