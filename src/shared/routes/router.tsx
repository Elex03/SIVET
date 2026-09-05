import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { lazy, Suspense } from "react";

import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../components/Layout/MainLayout";

import CircularIndeterminate from "../components/progress/CircularIndeterminate";

const Login = lazy(
  () => import("../../features/Login/Login")
);

const Unauthorized = lazy(
  () => import("../pages/Unauthorized")
);

const Dashboard = lazy(
  () => import("../../features/Dashboard/Dashboard")
);

const Inventory = lazy(
  () => import("../../features/Farmacia/Farmacia")
);

const Bodega = lazy(
  () => import("../../features/Bodega/Bodega")
);

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

      <Suspense
        fallback={<CircularIndeterminate />}
      >

        <Routes>

          {/* ================= LOGIN ================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          {/* ================= RUTAS PROTEGIDAS ================= */}

          <Route element={<ProtectedRoute />}>

            <Route element={<MainLayout />}>

              {/* ============ ADMINISTRADOR ============ */}

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["administrador"]}
                  />
                }
              >

                <Route
                  path="/dashboard"
                  element={<Dashboard />}
                />

                <Route
                  path="/inventario"
                  element={<Inventory />}
                />

              </Route>


              {/* ============ BODEGA ============ */}

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "administrador",
                      "bodega",
                    ]}
                  />
                }
              >

                <Route
                  path="/bodega"
                  element={<Bodega />}
                />

              </Route>


              {/* ============ FARMACIA ============ */}

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "administrador",
                      "farmacia",
                    ]}
                  />
                }
              >

                <Route
                  path="/farmacia"
                  element={<Pharmacy />}
                />

                <Route
                  path="/farmacia/solicitudes"
                  element={<Solicitudes />}
                />

                <Route
                  path="/farmacia/catalogos"
                  element={<CatalogosFarmacia />}
                />

                <Route
                  path="/farmacia/pedidos"
                  element={<Pedidos />}
                />

              </Route>


              {/* ============ SOLO ADMINISTRADOR ============ */}

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "administrador",
                    ]}
                  />
                }
              >

                <Route
                  path="/reportes"
                  element={
                    <div>
                      Reportes
                    </div>
                  }
                />

                <Route
                  path="/catalogos"
                  element={
                    <div>
                      Catálogos
                    </div>
                  }
                />

                <Route
                  path="/notificaciones"
                  element={
                    <div>
                      Notificaciones
                    </div>
                  }
                />

                <Route
                  path="/configuracion"
                  element={
                    <div>
                      Configuración
                    </div>
                  }
                />

              </Route>

            </Route>

          </Route>


          {/* ============ NO AUTORIZADO ============ */}

          <Route
            path="/no-autorizado"
            element={<Unauthorized />}
          />


          {/* ============ RUTA RAÍZ ============ */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          {/* ============ CUALQUIER OTRA ============ */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>

      </Suspense>

    </BrowserRouter>
  );
};

export default AppRouter;