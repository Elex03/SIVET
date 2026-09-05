import {
  Bell,
  Boxes,
  ChevronDown,
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

import { useAuth } from "../../context/AuthContext";

import "./sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [bodegaOpen, setBodegaOpen] = useState(true);
  const [pharmacyOpen, setPharmacyOpen] = useState(true);

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
    <aside className="sidebar">

      {/* ================= LOGO ================= */}

      <div className="sidebar-logo">
        <img
          src="/logo-sivet.png"
          alt="SIVET"
        />
      </div>

      <nav className="sidebar-menu">

        {/* ================================================= */}
        {/*                    ADMINISTRADOR                  */}
        {/* ================================================= */}

        {isAdmin && (
          <>
            {/* Dashboard */}

            <NavLink
              to="/dashboard"
              className="sidebar-item"
            >
              <Grid2X2 size={18} />
              <span>Dashboard</span>
            </NavLink>


            {/* Inventario */}

            <NavLink
              to="/inventario"
              className="sidebar-item"
            >
              <Boxes size={18} />
              <span>Inventario</span>
            </NavLink>


            {/* ================= BODEGA ================= */}

            <div className="sidebar-section">

              <button
                className="sidebar-item sidebar-button"
                onClick={() =>
                  setBodegaOpen(!bodegaOpen)
                }
              >
                <Store size={18} />

                <span>Bodega</span>

                {bodegaOpen ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>


              {bodegaOpen && (
                <div className="sidebar-submenu">

                  <NavLink to="/bodega/solicitudes">
                    Solicitudes
                  </NavLink>

                  <NavLink to="/bodega/estanteria">
                    Estantería
                  </NavLink>

                  <NavLink to="/bodega/catalogos">
                    Catálogos
                  </NavLink>

                  <NavLink to="/bodega/pedidos">
                    Pedidos
                  </NavLink>

                </div>
              )}

            </div>


            {/* ================= FARMACIA ================= */}

            <div className="sidebar-section">

              <button
                className="sidebar-item sidebar-button"
                onClick={() =>
                  setPharmacyOpen(!pharmacyOpen)
                }
              >
                <ShoppingCart size={18} />

                <span>Farmacia</span>

                {pharmacyOpen ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>


              {pharmacyOpen && (
                <div className="sidebar-submenu">

                  <NavLink to="/farmacia/solicitudes">
                    Solicitudes
                  </NavLink>

                  <NavLink to="/farmacia/catalogos">
                    Catálogos
                  </NavLink>

                  <NavLink to="/farmacia/pedidos">
                    Pedidos
                  </NavLink>

                </div>
              )}

            </div>


            {/* ================= ADMINISTRACIÓN ================= */}

            <NavLink
              to="/reportes"
              className="sidebar-item"
            >
              <FileText size={18} />
              <span>Reportes</span>
            </NavLink>


            <NavLink
              to="/catalogos"
              className="sidebar-item"
            >
              <ClipboardList size={18} />
              <span>Catálogos</span>
            </NavLink>


            <div className="sidebar-title">
              Configuración
            </div>


            <NavLink
              to="/notificaciones"
              className="sidebar-item"
            >
              <Bell size={18} />
              <span>Notificaciones</span>
            </NavLink>


            <NavLink
              to="/configuracion"
              className="sidebar-item"
            >
              <Settings size={18} />
              <span>Configuración</span>
            </NavLink>
          </>
        )}


        {/* ================================================= */}
        {/*                       BODEGA                      */}
        {/* ================================================= */}

        {isBodega && (
          <>
            <NavLink
              to="/bodega"
              className="sidebar-item"
            >
              <Store size={18} />
              <span>Bodega</span>
            </NavLink>

            <NavLink
              to="/bodega/solicitudes"
              className="sidebar-item"
            >
              <ClipboardList size={18} />
              <span>Solicitudes</span>
            </NavLink>

            <NavLink
              to="/bodega/estanteria"
              className="sidebar-item"
            >
              <Boxes size={18} />
              <span>Estantería</span>
            </NavLink>

            <NavLink
              to="/bodega/catalogos"
              className="sidebar-item"
            >
              <ClipboardList size={18} />
              <span>Catálogos</span>
            </NavLink>

            <NavLink
              to="/bodega/pedidos"
              className="sidebar-item"
            >
              <ShoppingCart size={18} />
              <span>Pedidos</span>
            </NavLink>
          </>
        )}


        {/* ================================================= */}
        {/*                      FARMACIA                     */}
        {/* ================================================= */}

        {isFarmacia && (
          <>
            <NavLink
              to="/farmacia"
              className="sidebar-item"
            >
              <ShoppingCart size={18} />
              <span>Farmacia</span>
            </NavLink>

            <NavLink
              to="/farmacia/solicitudes"
              className="sidebar-item"
            >
              <ClipboardList size={18} />
              <span>Solicitudes</span>
            </NavLink>

            <NavLink
              to="/farmacia/catalogos"
              className="sidebar-item"
            >
              <ClipboardList size={18} />
              <span>Catálogos</span>
            </NavLink>

            <NavLink
              to="/farmacia/pedidos"
              className="sidebar-item"
            >
              <ShoppingCart size={18} />
              <span>Pedidos</span>
            </NavLink>
          </>
        )}

      </nav>


      {/* ================= USUARIO ================= */}

      <div className="sidebar-bottom">

        <div className="sidebar-user">
          <span>{user.username}</span>

          <small>
            {user.role}
          </small>
        </div>


        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={17} />

          Cerrar sesión
        </button>

      </div>

    </aside>
  );
};

export default Sidebar;