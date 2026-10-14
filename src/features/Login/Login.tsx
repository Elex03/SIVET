import { useState } from "react";
import type { FormEvent } from 'react';
import type { User as AuthUser } from '../../shared/types/auth';
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../shared/context/auth";
import UNA from "../../shared/assets/images/UNA.png";
import { User, Lock, ShieldAlert, LogIn } from "lucide-react";

const Login = ({ preparation = false }: { preparation?: boolean }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Por favor, complete todos los campos requeridos.");
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    let account: AuthUser | null;
    try {account = await login(username, password);} catch(reason) {setSubmitting(false);setError(reason instanceof Error?reason.message:'No se pudo iniciar sesión.');return;}
    setSubmitting(false);

    if (!account) {
      setError("Credenciales incorrectas. Verifique e intente nuevamente.");
      return;
    }

    const role = account.role; // El rol pertenece a la cuenta autenticada.
    if (role === "consulta") { navigate("/inventario"); } else if (role === "preparador") { navigate("/preparacion"); } else if (role === "administrador") {
      navigate("/dashboard");
    } else if (role === "bodega") {
      navigate("/bodega");
    } else if (role === "farmacia") {
      navigate("/farmacia");
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50 relative overflow-x-hidden py-4 px-3">

      {/* ========================================== */}
      {/* DECORACIONES DE FONDO (Sutiles y Corporativas) */}
      {/* ========================================== */}



      {/* ========================================== */}
      {/* TARJETA DE LOGIN */}
      {/* ========================================== */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 sm:p-10 relative z-10 animate-in zoom-in-95 fade-in duration-500">

        {/* CABECERA: Logo y Títulos */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 sm:w-40 sm:h-40 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-2">
            <img src={UNA} alt="Logo UNA" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-[#304a6d] tracking-tight">{preparation ? "Preparación · Acceso" : "Acceso a SIVET"}</h1>
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
                id="username" autoComplete="username"
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
                id="password" autoComplete="current-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-[#1e293b] font-medium outline-none focus:bg-white focus:border-[#304a6d] focus:ring-4 focus:ring-[#304a6d]/10 transition-all placeholder:text-slate-400"
              />
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
            type="submit" disabled={submitting}
            className="w-full mt-2 bg-[#304a6d] hover:bg-[#233854] text-white font-bold py-3.5 rounded-xl shadow-md shadow-[#304a6d]/20 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Iniciar Sesión</span>
            <LogIn size={18} className="" />
          </button>

        </form>

      </div>
    </div>
  );
};

export default Login;
