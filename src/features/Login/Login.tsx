import { useState } from "react";
import type { FormEvent } from 'react';
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../shared/context/AuthContext";
import type { Role } from "../../shared/types/auth";
import UNA from "../../shared/assets/images/UNA.png";
import { User, Lock, ShieldAlert, LogIn, ChevronDown } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role | "">("");

  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username || !password || !role) {
      setError("Por favor, complete todos los campos requeridos.");
      return;
    }

    const success = login(username, password, role);

    if (!success) {
      setError("Credenciales incorrectas. Verifique e intente nuevamente.");
      return;
    }

    // Redirección dependiendo del rol
    if (role === "administrador") {
      navigate("/dashboard");
    } else if (role === "bodega") {
      navigate("/bodega");
    } else if (role === "farmacia") {
      navigate("/farmacia");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      
      {/* ========================================== */}
      {/* DECORACIONES DE FONDO (Sutiles y Corporativas) */}
      {/* ========================================== */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#304a6d]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-in fade-in duration-1000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-slate-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-in fade-in duration-1000 delay-300"></div>

      {/* ========================================== */}
      {/* TARJETA DE LOGIN */}
      {/* ========================================== */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 relative z-10 animate-in zoom-in-95 fade-in duration-500">
        
        {/* CABECERA: Logo y Títulos */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-40 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-2">
            <img src={UNA} alt="Logo UNA" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-[#304a6d] tracking-tight">Acceso a SIVET</h1>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1 text-center">
            Sistema de Inventario Veterinario
          </p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Campo: Usuario */}
          <div>
            <label htmlFor="username" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User size={18} className="text-slate-400" />
              </div>
              <input
                id="username"
                type="text"
                placeholder="Ingrese su credencial institucional"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-[#1e293b] font-medium outline-none focus:bg-white focus:border-[#304a6d] focus:ring-4 focus:ring-[#304a6d]/10 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>
          </div>

          {/* Campo: Contraseña */}
          <div>
            <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-[#1e293b] font-medium outline-none focus:bg-white focus:border-[#304a6d] focus:ring-4 focus:ring-[#304a6d]/10 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Campo: Rol */}
          <div>
            <label htmlFor="role" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Perfil de Acceso
            </label>
            <div className="relative">
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-sm text-[#1e293b] font-medium outline-none appearance-none cursor-pointer focus:bg-white focus:border-[#304a6d] focus:ring-4 focus:ring-[#304a6d]/10 transition-all"
              >
                <option value="" disabled className="text-slate-400 font-normal">Seleccione su rol asignado</option>
                <option value="administrador">Administrador del Sistema</option>
                <option value="bodega">Gestión de Bodega</option>
                <option value="farmacia">Operador de Farmacia</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <ChevronDown size={16} className="text-slate-400" />
              </div>
            </div>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <ShieldAlert size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold text-rose-700 leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* Botón de Submit - Azul Marino Institucional */}
          <button 
            type="submit"
            className="w-full mt-2 bg-[#304a6d] hover:bg-[#233854] text-white font-bold py-3.5 rounded-xl shadow-md shadow-[#304a6d]/20 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Iniciar Sesión</span>
            <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

        </form>

      </div>
    </div>
  );
};

export default Login;