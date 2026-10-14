import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { lazy, Suspense } from "react";

import ProtectedRoute from "../pages/ProtectedRoute";
import MainLayout from "../pages/MainLayout";

import PageSkeleton from "../components/Layout/PageSkeleton";



const PreparationPortal = lazy(() => import("../../features/Bodega/pages/PreparationPortal"));
const Preparacion = lazy(() => import("../../features/Bodega/pages/Preparacion"));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const Login = lazy(
  () => import("../../features/Login/Login")
);

const Salidas = lazy(() => import('../../features/Farmacia/Salidas'));
const Farmacia = lazy(() => import("../../features/Farmacia/Solicitudes"));
const SystemPage = lazy(() => import("../pages/SystemPage"));
const NotificationsPage = lazy(() => import('../../features/Farmacia/NotificationsPage'));

const Unauthorized = lazy(
  () => import("../pages/Unauthorized")
);

const Dashboard = lazy(
  () => import("../../features/Dashboard/Dashboard")
);
const Reportes = lazy(
  () => import("../../features/Reportes/Reportes")
);
const Catalogos = lazy(
  () => import("../../features/Catalogos/CatalogManager")
);

const Inventory = lazy(
  () => import("../../features/Inventario/InventoryPage")
);

// ======== BODEGA COMPONENTS ========
const Bodega = lazy(
  () => import("../../features/Inventario/InventoryPage")
);


const SolicitudesBodega = lazy(
  () => import("../../features/Farmacia/Solicitudes") // Ajusta la ruta
);
const EstanteriaBodega = lazy(
  () => import("../../features/Inventario/InventoryPage") // Ajusta la ruta
);
const CatalogosBodega = lazy(
  () => import("../../features/Catalogos/CatalogManager") // Ajusta la ruta
);

// Nuevas rutas de Pedidos
const ListadoPedidosBodega = lazy(
  () => import("../../features/Bodega/pages/Pedidos")
);
const RecepcionPedidosBodega = lazy(
  () => import("../../features/Bodega/pages/Pedidos")
);



const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-5 sm:p-8"><PageSkeleton heading /></div>}>
        <Routes>
          {/* ================= LOGIN ================= */}
          <Route path="/login" element={<Login />} /><Route path="/preparacion/login" element={<Login preparation />} />
<Route element={<ProtectedRoute allowedRoles={["administrador", "bodega", "preparador"]} />}><Route path="/preparacion" element={<PreparationPortal />} /></Route>

          {/* ================= RUTAS PROTEGIDAS ================= */}
          <Route element={<ProtectedRoute allowedRoles={["administrador", "bodega", "farmacia", "consulta"]} />}>
            <Route element={<MainLayout />}>
              <Route path="/configuracion" element={<SystemPage settings />} /><Route element={<ProtectedRoute allowedRoles={["administrador","consulta"]} />}><Route path="/inventario" element={<Inventory />} /></Route>

              {/* ============ ADMINISTRADOR ============ */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["administrador"]} />
                }
              >
                <Route path="/usuarios" element={<UsersPage />} /><Route path="/dashboard" element={<Dashboard />} />

              </Route>

              {/* ============ BODEGA ============ */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["administrador", "bodega"]} />
                }
              >
                <Route path="/bodega/preparacion" element={<Preparacion />} />
                <Route path="/bodega" element={<Bodega location="Bodega Central" />} />
                <Route path="/bodega/solicitudes" element={<SolicitudesBodega bodega />} />
                <Route path="/bodega/notificaciones" element={<NotificationsPage bodega />} />
                <Route path="/bodega/estanteria" element={<EstanteriaBodega location="Bodega Central" />} />
                <Route path="/bodega/catalogos" element={<CatalogosBodega />} />

                {/* Rutas de Pedidos actualizadas */}
                <Route path="/bodega/pedidos" element={<ListadoPedidosBodega />} />
                <Route path="/bodega/pedidos/recepcion" element={<RecepcionPedidosBodega />} />
              </Route>

              {/* ============ FARMACIA ============ */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["administrador", "farmacia"]} />
                }
              >
                <Route path="/farmacia/catalogos" element={<Catalogos locationsOnly />} />
                <Route path="/farmacia" element={<Farmacia />} />
                <Route path="/farmacia/salidas" element={<Salidas />} />
                <Route path="/farmacia/solicitudes" element={<Farmacia />} />
                <Route path="/farmacia/notificaciones" element={<NotificationsPage />} />
                <Route path="/farmacia/inventario" element={<Inventory location="Farmacia" />} />
              </Route>

              {/* ============ SOLO ADMINISTRADOR ============ */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["administrador"]} />
                }
              >
                <Route
                  path="/reportes"
                  element={<Reportes />}
                />
                <Route
                  path="/catalogos"
                  element={<Catalogos />}
                />
                <Route
                  path="/notificaciones"
                  element={<NotificationsPage combined />}
                />

              </Route>

            </Route>
          </Route>

          {/* ============ NO AUTORIZADO ============ */}
          <Route path="/no-autorizado" element={<Unauthorized />} />

          {/* ============ RUTA RAÍZ ============ */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ============ CUALQUIER OTRA ============ */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
