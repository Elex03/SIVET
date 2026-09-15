import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { lazy, Suspense } from "react";

import ProtectedRoute from "../pages/ProtectedRoute";
import MainLayout from "../pages/MainLayout";

import CircularIndeterminate from "../components/progress/CircularIndeterminate";
import Inventario from "../../features/Inventario/Inventario";


const Login = lazy(
  () => import("../../features/Login/Login")
);

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
  () => import("../../features/Catalogos/Catalogos")
);

const Inventory = lazy(
  () => import("../../features/Inventario/Inventario")
);

// ======== BODEGA COMPONENTS ========
const Bodega = lazy(
  () => import("../../features/Bodega/pages/Bodega")
);

const DetallePedidoBodeda = lazy(
  () => import("../../features/Bodega/pages/DetallePedidos")
);
const SolicitudesBodega = lazy(
  () => import("../../features/Bodega/pages/Solicitudes") // Ajusta la ruta
);
const EstanteriaBodega = lazy(
  () => import("../../features/Bodega/pages/Bodega") // Ajusta la ruta
);
const CatalogosBodega = lazy(
  () => import("../../features/Bodega/pages/Bodega") // Ajusta la ruta
);

// Nuevas rutas de Pedidos
const ListadoPedidosBodega = lazy(
  () => import("../../features/Bodega/pages/ListadoPedidos")
);
const RecepcionPedidosBodega = lazy(
  () => import("../../features/Bodega/pages/RecepcionPedidos")
);

// ======== FARMACIA COMPONENTS ========
const Pharmacy = lazy(
  () => import("../../features/Farmacia/Farmacia")
);
const Solicitudes = lazy(
  () => import("../../features/Farmacia/Farmacia")
);
const CatalogosFarmacia = lazy(
  () => import("../../features/Farmacia/Farmacia")
);
const Pedidos = lazy(
  () => import("../../features/Farmacia/Farmacia")
);

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<CircularIndeterminate />}>
        <Routes>
          {/* ================= LOGIN ================= */}
          <Route path="/login" element={<Login />} />

          {/* ================= RUTAS PROTEGIDAS ================= */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>

              {/* ============ ADMINISTRADOR ============ */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["administrador"]} />
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventario" element={<Inventory />} />
              </Route>

              {/* ============ BODEGA ============ */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["administrador", "bodega"]} />
                }
              >
                <Route path="/bodega" element={<Bodega />} />
                <Route path="/bodega/solicitudes" element={<SolicitudesBodega />} />
                <Route path="/bodega/estanteria" element={<EstanteriaBodega />} />
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
                <Route path="/farmacia" element={<Pharmacy />} />
                <Route path="/farmacia/solicitudes" element={<Solicitudes />} />
                <Route path="/farmacia/catalogos" element={<CatalogosFarmacia />} />
                <Route path="/farmacia/pedidos" element={<Pedidos />} />
                <Route path="/farmacia/inventario" element={<Pedidos />} />
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
                  element={<div>Notificaciones</div>}
                />
                <Route
                  path="/configuracion"
                  element={<div>Configuración</div>}
                />
                <Route
                  path="/inventario"
                  element={<Inventario/>}
                />
              </Route>

              <Route path="/bodega/pedidos/:id"
                element={<DetallePedidoBodeda />
                } />

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