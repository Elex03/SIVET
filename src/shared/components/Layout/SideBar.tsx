import React, { useState } from "react";
import {
  Bell,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  FileText,
  Grid2X2,
  LogOut,
  Settings,
  ShoppingCart,
  Store,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import UNALogo from "../../assets/images/UNA.png";
import SIVETLogo from "../../assets/images/SIVET.png";

import { useAuth } from "../../context/AuthContext";

import "./sidebar.css";

type SubmenuType = "bodega" | "farmacia" | null;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [openSubmenu, setOpenSubmenu] = useState<SubmenuType>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "administrador";
  const isBodega = user.role === "bodega";
  const isFarmacia = user.role === "farmacia";

  const handleLogout = (): void => {
    logout();
    navigate("/login");
  };

  const toggleMenu = (menu: "bodega" | "farmacia"): void => {
    if (!isCollapsed) {
      setOpenSubmenu((prev) => (prev === menu ? null : menu));
    }
  };

  return (
    <aside
      className={`sidebar h-screen flex flex-col sticky top-0 transition-all duration-300 ${
        isCollapsed ? "sidebar-collapsed w-20" : "w-64"
      }`}
    >
      {/* ================= HEADER Y LOGO ================= */}
      <div className="relative flex flex-col items-center justify-center py-4 pt-8">
        
        {/* Botón para colapsar (Visible solo cuando está abierto) */}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-[#304a6d] hover:bg-gray-100 rounded-md transition-colors z-20"
            title="Colapsar menú"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Contenedor del logo interactivo (Hover al estar colapsado) */}
        <div 
          className={`relative flex flex-col items-center w-full px-2 transition-all duration-300 ${
            isCollapsed ? "cursor-pointer group" : ""
          }`}
          onClick={() => {
            if (isCollapsed) setIsCollapsed(false);
          }}
          title={isCollapsed ? "Expandir menú" : ""}
        >
          {/* Overlay que aparece en hover solo si está colapsado */}
          {isCollapsed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md z-10 m-2">
              <div className="bg-white/80 p-1.5 rounded-full shadow-sm text-[#304a6d]">
                <ChevronRight size={22} />
              </div>
            </div>
          )}

          {/* Logos con efecto de atenuación en hover si está colapsado */}
          <div className={`flex flex-col items-center w-full transition-opacity duration-300 ${
            isCollapsed ? "group-hover:opacity-40" : ""
          }`}>
            <img src={UNALogo} alt="UNA" className="logo-una mx-auto" />
            {!isCollapsed ? (
              <div className="sidebar-logo-right mt-2 flex flex-col items-center">
                <img src={SIVETLogo} alt="SIVET" className="logo-sivet" />
                <span className="text-[14px] font-normal tracking-[0.2px] text-[#304a6d] leading-tight text-center mt-1">
                  Sistema de Inventario
                </span>
                <span className="text-[14px] font-normal tracking-[0.2px] text-[#304a6d] leading-tight text-center mt-1">
                  Veterinario
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="sidebar-menu overflow-y-auto flex-1 mt-2">
        {/* ================= ADMINISTRADOR ================= */}
        {isAdmin ? (
          <>
            <NavLink to="/dashboard" className="sidebar-item" title="Dashboard">
              <Grid2X2 size={18} />
              {!isCollapsed ? <span>Dashboard</span> : null}
            </NavLink>

            <NavLink to="/inventario" className="sidebar-item" title="Inventario">
              <Boxes size={18} />
              {!isCollapsed ? <span>Inventario</span> : null}
            </NavLink>

            {/* ================= BODEGA ================= */}
            <div className="sidebar-section">
              <button
                className="sidebar-item w-full border-none text-left flex items-center"
                onClick={() => toggleMenu("bodega")}
                title="Bodega"
              >
                <Store size={18} />
                {!isCollapsed ? <span className="flex-1 ml-2">Bodega</span> : null}
                
                {!isCollapsed ? (
                  openSubmenu === "bodega" ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )
                ) : null}
              </button>

              {openSubmenu === "bodega" && !isCollapsed ? (
                <div className="sidebar-submenu flex flex-col pl-6 mt-1">
                  <NavLink to="/bodega/solicitudes" className="text-sm py-1">Solicitudes</NavLink>
                  <NavLink to="/bodega/estanteria" className="text-sm py-1">Estantería</NavLink>
                  <NavLink to="/bodega/catalogos" className="text-sm py-1">Catálogos</NavLink>
                  <NavLink to="/bodega/pedidos" className="text-sm py-1">Pedidos</NavLink>
                </div>
              ) : null}
            </div>

            {/* ================= FARMACIA ================= */}
            <div className="sidebar-section">
              <button
                className="sidebar-item w-full border-none text-left flex items-center"
                onClick={() => toggleMenu("farmacia")}
                title="Farmacia"
              >
                <ShoppingCart size={18} />
                {!isCollapsed ? <span className="flex-1 ml-2">Farmacia</span> : null}

                {!isCollapsed ? (
                  openSubmenu === "farmacia" ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )
                ) : null}
              </button>

              {openSubmenu === "farmacia" && !isCollapsed ? (
                <div className="sidebar-submenu flex flex-col pl-6 mt-1">
                  <NavLink to="/farmacia/solicitudes" className="text-sm py-1">Solicitudes</NavLink>
                  <NavLink to="/farmacia/catalogos" className="text-sm py-1">Catálogos</NavLink>
                  <NavLink to="/farmacia/pedidos" className="text-sm py-1">Pedidos</NavLink>
                </div>
              ) : null}
            </div>

            <NavLink to="/reportes" className="sidebar-item" title="Reportes">
              <FileText size={18} />
              {!isCollapsed ? <span>Reportes</span> : null}
            </NavLink>

            <NavLink to="/catalogos" className="sidebar-item" title="Catálogos">
              <ClipboardList size={18} />
              {!isCollapsed ? <span>Catálogos</span> : null}
            </NavLink>

            {!isCollapsed ? (
              <div className="sidebar-title mt-4 mb-2 text-xs font-semibold uppercase text-gray-500">
                Configuración
              </div>
            ) : null}

            <NavLink to="/notificaciones" className="sidebar-item" title="Notificaciones">
              <Bell size={18} />
              {!isCollapsed ? <span>Notificaciones</span> : null}
            </NavLink>

            <NavLink to="/configuracion" className="sidebar-item" title="Configuración">
              <Settings size={18} />
              {!isCollapsed ? <span>Configuración</span> : null}
            </NavLink>
          </>
        ) : null}

        {/* ================= BODEGA ROL ================= */}
        {isBodega ? (
          <>
            <NavLink to="/bodega" className="sidebar-item" title="Bodega">
              <Store size={18} />
              {!isCollapsed ? <span>Bodega</span> : null}
            </NavLink>
            <NavLink to="/bodega/solicitudes" className="sidebar-item" title="Solicitudes">
              <ClipboardList size={18} />
              {!isCollapsed ? <span>Solicitudes</span> : null}
            </NavLink>
            <NavLink to="/bodega/estanteria" className="sidebar-item" title="Estantería">
              <Boxes size={18} />
              {!isCollapsed ? <span>Estantería</span> : null}
            </NavLink>
            <NavLink to="/bodega/catalogos" className="sidebar-item" title="Catálogos">
              <ClipboardList size={18} />
              {!isCollapsed ? <span>Catálogos</span> : null}
            </NavLink>
            <NavLink to="/bodega/pedidos" className="sidebar-item" title="Pedidos">
              <ShoppingCart size={18} />
              {!isCollapsed ? <span>Pedidos</span> : null}
            </NavLink>
          </>
        ) : null}

        {/* ================= FARMACIA ROL ================= */}
        {isFarmacia ? (
          <>
            <NavLink to="/farmacia" className="sidebar-item" title="Farmacia">
              <ShoppingCart size={18} />
              {!isCollapsed ? <span>Farmacia</span> : null}
            </NavLink>
            <NavLink to="/farmacia/solicitudes" className="sidebar-item" title="Solicitudes">
              <ClipboardList size={18} />
              {!isCollapsed ? <span>Solicitudes</span> : null}
            </NavLink>
            <NavLink to="/farmacia/catalogos" className="sidebar-item" title="Catálogos">
              <ClipboardList size={18} />
              {!isCollapsed ? <span>Catálogos</span> : null}
            </NavLink>
            <NavLink to="/farmacia/pedidos" className="sidebar-item" title="Pedidos">
              <ShoppingCart size={18} />
              {!isCollapsed ? <span>Pedidos</span> : null}
            </NavLink>
          </>
        ) : null}
      </nav>

      {/* ================= USUARIO ================= */}
    <div className="sidebar-bottom mt-auto border-t p-4 flex flex-col gap-3">
        {/* Tarjeta de perfil alineada a la izquierda */}
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-start gap-3"} bg-gray-50 p-2 rounded-lg border border-gray-100`}>
          {/* Círculo con inicial */}
          <div className="w-8 h-8 rounded-full bg-[#64748b] flex items-center justify-center text-white font-semibold flex-shrink-0">
            {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
          </div>
          
          {/* Nombre y Rol (Oculto cuando está colapsado) */}
          {!isCollapsed && (
            <div className="flex flex-col items-start text-left overflow-hidden flex-1">
              <span className="font-semibold text-sm text-[#304a6d] truncate leading-tight w-full">
                {user?.username || "Usuario"}
              </span>
              <span className="text-xs text-gray-500 capitalize truncate w-full mt-0.5">
                {user?.role || "Rol"}
              </span>
            </div>
          )}
        </div>

        <button
          className={`logout-button w-full flex items-center ${
            isCollapsed ? "justify-center" : "justify-start px-3"
          } gap-3 bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-md transition-colors`}
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogOut size={17} />
          {!isCollapsed ? <span>Cerrar sesión</span> : null}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;