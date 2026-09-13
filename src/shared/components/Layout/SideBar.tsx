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
import { useState } from "react";
import UNALogo from "../../assets/images/UNA.png";
import SIVETLogo from "../../assets/images/SIVET.png";

import { useAuth } from "../../context/AuthContext";

import "./sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [bodegaOpen, setBodegaOpen] = useState(true);
  const [pharmacyOpen, setPharmacyOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "administrador";
  const isBodega = user.role === "bodega";
  const isFarmacia = user.role === "farmacia";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Botón para colapsar / expandir */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-[#304a6d] text-white p-1 rounded-full shadow-md hover:bg-[#23354d] transition-colors z-10"
        title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* ================= LOGO ================= */}
      <div className="sidebar-logo-container">
        <img src={UNALogo} alt="UNA" className="logo-una" />
        {!isCollapsed && (
          <div className="sidebar-logo-right">
            <img src={SIVETLogo} alt="SIVET" className="logo-sivet" />
            <span className="text-[10px] font-bold tracking-[0.2px] text-[#304a6d] leading-tight text-center">
              Sistema de Inventario Veterinario
            </span>
          </div>
        )}
      </div>

      <nav className="sidebar-menu overflow-y-auto flex-1">
        {/* ================= ADMINISTRADOR ================= */}
        {isAdmin && (
          <>
            <NavLink to="/dashboard" className="sidebar-item" title="Dashboard">
              <Grid2X2 size={18} />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>

            <NavLink
              to="/inventario"
              className="sidebar-item"
              title="Inventario"
            >
              <Boxes size={18} />
              {!isCollapsed && <span>Inventario</span>}
            </NavLink>

            {/* ================= BODEGA ================= */}
            <div className="sidebar-section">
              <button
                className="sidebar-item sidebar-button"
                onClick={() => setBodegaOpen(!bodegaOpen)}
                title="Bodega"
              >
                <Store size={18} />
                {!isCollapsed && (
                  <>
                    <span>Bodega</span>
                    {bodegaOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </>
                )}
              </button>

              {bodegaOpen && !isCollapsed && (
                <div className="sidebar-submenu">
                  <NavLink to="/bodega/solicitudes">Solicitudes</NavLink>
                  <NavLink to="/bodega/estanteria">Estantería</NavLink>
                  <NavLink to="/bodega/catalogos">Catálogos</NavLink>
                  <NavLink to="/bodega/pedidos">Pedidos</NavLink>
                </div>
              )}
            </div>

            {/* ================= FARMACIA ================= */}
            <div className="sidebar-section">
              <button
                className="sidebar-item sidebar-button"
                onClick={() => setPharmacyOpen(!pharmacyOpen)}
                title="Farmacia"
              >
                <ShoppingCart size={18} />
                {!isCollapsed && (
                  <>
                    <span>Farmacia</span>
                    {pharmacyOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </>
                )}
              </button>

              {pharmacyOpen && !isCollapsed && (
                <div className="sidebar-submenu">
                  <NavLink to="/farmacia/solicitudes">Solicitudes</NavLink>
                  <NavLink to="/farmacia/catalogos">Catálogos</NavLink>
                  <NavLink to="/farmacia/pedidos">Pedidos</NavLink>
                </div>
              )}
            </div>

            <NavLink to="/reportes" className="sidebar-item" title="Reportes">
              <FileText size={18} />
              {!isCollapsed && <span>Reportes</span>}
            </NavLink>

            <NavLink to="/catalogos" className="sidebar-item" title="Catálogos">
              <ClipboardList size={18} />
              {!isCollapsed && <span>Catálogos</span>}
            </NavLink>

            {!isCollapsed && <div className="sidebar-title">Configuración</div>}

            <NavLink
              to="/notificaciones"
              className="sidebar-item"
              title="Notificaciones"
            >
              <Bell size={18} />
              {!isCollapsed && <span>Notificaciones</span>}
            </NavLink>

            <NavLink
              to="/configuracion"
              className="sidebar-item"
              title="Configuración"
            >
              <Settings size={18} />
              {!isCollapsed && <span>Configuración</span>}
            </NavLink>
          </>
        )}

        {/* ================= BODEGA ROL ================= */}
        {isBodega && (
          <>
            <NavLink to="/bodega" className="sidebar-item" title="Bodega">
              <Store size={18} />
              {!isCollapsed && <span>Bodega</span>}
            </NavLink>
            <NavLink
              to="/bodega/solicitudes"
              className="sidebar-item"
              title="Solicitudes"
            >
              <ClipboardList size={18} />
              {!isCollapsed && <span>Solicitudes</span>}
            </NavLink>
            <NavLink
              to="/bodega/estanteria"
              className="sidebar-item"
              title="Estantería"
            >
              <Boxes size={18} />
              {!isCollapsed && <span>Estantería</span>}
            </NavLink>
            <NavLink
              to="/bodega/catalogos"
              className="sidebar-item"
              title="Catálogos"
            >
              <ClipboardList size={18} />
              {!isCollapsed && <span>Catálogos</span>}
            </NavLink>
            <NavLink
              to="/bodega/pedidos"
              className="sidebar-item"
              title="Pedidos"
            >
              <ShoppingCart size={18} />
              {!isCollapsed && <span>Pedidos</span>}
            </NavLink>
          </>
        )}

        {/* ================= FARMACIA ROL ================= */}
        {isFarmacia && (
          <>
            <NavLink to="/farmacia" className="sidebar-item" title="Farmacia">
              <ShoppingCart size={18} />
              {!isCollapsed && <span>Farmacia</span>}
            </NavLink>
            <NavLink
              to="/farmacia/solicitudes"
              className="sidebar-item"
              title="Solicitudes"
            >
              <ClipboardList size={18} />
              {!isCollapsed && <span>Solicitudes</span>}
            </NavLink>
            <NavLink
              to="/farmacia/catalogos"
              className="sidebar-item"
              title="Catálogos"
            >
              <ClipboardList size={18} />
              {!isCollapsed && <span>Catálogos</span>}
            </NavLink>
            <NavLink
              to="/farmacia/pedidos"
              className="sidebar-item"
              title="Pedidos"
            >
              <ShoppingCart size={18} />
              {!isCollapsed && <span>Pedidos</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* ================= USUARIO ================= */}
      <div className="sidebar-bottom">
        {!isCollapsed && (
          <div className="sidebar-user">
            <span className="sidebar-username">{user.username}</span>
            <small className="sidebar-role">{user.role}</small>
          </div>
        )}

        <button
          className="logout-button"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogOut size={17} />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
