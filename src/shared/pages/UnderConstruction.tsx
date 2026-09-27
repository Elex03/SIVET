import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Wrench, ArrowLeft, Mail, HardHat } from 'lucide-react';

const UnderConstruction: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* ========================================== */}
      {/* FONDOS Y DECORACIONES SUTILES */}
      {/* ========================================== */}
      {/* Círculo difuminado azul claro arriba a la izquierda */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-in fade-in duration-1000"></div>
      {/* Círculo difuminado celeste abajo a la derecha */}
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-in fade-in duration-1000 delay-300"></div>

      {/* ========================================== */}
      {/* TARJETA CENTRAL */}
      {/* ========================================== */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 md:p-12 max-w-2xl w-full text-center relative z-10 animate-in zoom-in-95 fade-in duration-500">
        
        {/* LOGO SIVET */}
        <div className="flex justify-center items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-[#304a6d] rounded-xl flex items-center justify-center shadow-md">
            <Wrench className="text-white" size={24} />
          </div>
          <div className="text-left flex flex-col justify-center">
            <h1 className="text-2xl font-black text-[#304a6d] leading-none tracking-tight">SIVET</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Universidad Nacional Agraria</span>
          </div>
        </div>

        {/* ILUSTRACIÓN ANIMADA LIGERA */}
        <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-50 rounded-full animate-pulse"></div>
          <div className="absolute inset-4 bg-blue-100 rounded-full flex items-center justify-center shadow-inner border border-blue-200/50">
            {/* El engranaje gira lentamente gracias a Tailwind (spin) */}
            <Settings size={40} className="text-[#3b82f6] animate-[spin_10s_linear_infinite]" />
          </div>
          {/* Casco superpuesto para darle el toque de "Construcción" */}
          <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <HardHat size={24} className="text-amber-500" />
          </div>
        </div>

        {/* TEXTOS */}
        <h2 className="text-2xl md:text-3xl font-black text-[#1e293b] mb-4">Sitio en Construcción</h2>
        <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-10">
          Estamos trabajando arduamente en la nueva interfaz del <strong>Sistema de Inventario Veterinario</strong>. <br className="hidden md:block" /> 
          Muy pronto esta sección estará disponible con una experiencia totalmente optimizada para tu gestión.
        </p>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowLeft size={18} /> Volver atrás
          </button>
          <button
            onClick={() => window.location.href = 'mailto:soporte@una.edu.ni'}
            className="w-full sm:w-auto px-8 py-3 bg-[#3b82f6] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Mail size={18} /> Soporte Técnico
          </button>
        </div>
        
      </div>

      {/* FOOTER */}
      <div className="mt-12 text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10 flex flex-col items-center gap-2">
        <p>&copy; {new Date().getFullYear()} Universidad Nacional Agraria.</p>
        <p>Todos los derechos reservados.</p>
      </div>

    </div>
  );
};

export default UnderConstruction;