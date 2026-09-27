import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, Clock, AlertTriangle, PackagePlus } from "lucide-react";

import PageHeader from "../../../shared/components/Layout/PageHeader";
import SummaryCard from "../../../shared/components/charts/SummaryCard";
import NotificationCard from "../../../shared/components/Layout/NotificationCard";
import ActivityItem from "../../../shared/components/Layout/ActivityItem";
import Table from "../../../shared/components/Table/Table";
import type { TableColumn } from "../../../shared/components/Table/Table";

import UNALOGO from "../../../shared/assets/images/UNA.png";

const InventarioFarmacia: React.FC = () => {
  const navigate = useNavigate();

  const columns: TableColumn[] = [
    {
      id: "imagen",
      label: "",
      render: (row) => (
        <img
          src={row.imagen || UNALOGO}
          alt={row.nombre}
          className="w-10 h-10 rounded-md object-cover border border-gray-200 bg-white"
          onError={(e) => {
            (e.target as HTMLImageElement).src = UNALOGO;
          }}
        />
      ),
    },
    { id: "codigo", label: "Código" },
    { id: "nombre", label: "Nombre" },
    { id: "categoria", label: "Categoría" },
    { id: "principioActivo", label: "Principio Activo" },
    { id: "existencia", label: "Existencia" },
    { id: "estado", label: "Estado" },
  ];

  // Datos de prueba adaptados a Farmacia
  const inventoryData = [
    {
      id: 1,
      imagen: "https://via.placeholder.com/150",
      codigo: "MED-101",
      nombre: "Amoxicilina 500mg",
      categoria: "Antibiótico",
      principioActivo: "Amoxicilina",
      existencia: "85 uni",
      estado: "Disponible",
    },
    {
      id: 2,
      imagen: "",
      codigo: "MED-102",
      nombre: "Ibuprofeno 400mg",
      categoria: "Analgésico",
      principioActivo: "Ibuprofeno",
      existencia: "12 uni",
      estado: "Bajo stock",
    },
  ];

  const handleViewDetails = (row: any) => {
    navigate(`/farmacia/medicamento/${row.id}`);
  };

  const handleEdit = (row: any) => {
    console.log("Editar medicamento en farmacia:", row.nombre);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col h-full">
      <PageHeader
        header="Farmacia"
        sub="Controla la dispensación, stock disponible y solicitudes de medicamentos."
      />

      <div className="flex flex-col xl:flex-row gap-8 w-full flex-1 min-h-0">
        {/* --- COLUMNA PRINCIPAL --- */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <SummaryCard
              title="Total medicamentos en farmacia"
              value="310"
              icon={Package}
              trendValue="8%"
              trendType="up"
              trendText="aumento vs mes anterior"
            />
            <SummaryCard
              title="Medicamentos próximos a vencerse"
              value="2"
              icon={Clock}
              trendValue="1"
              trendType="down"
              trendText="menos que el mes anterior"
            />
            <SummaryCard
              title="Medicamentos próximos a agotarse"
              value="15"
              icon={AlertTriangle}
              trendValue="3%"
              trendType="up"
              trendText="aumento vs mes anterior"
            />
          </div>

          {/* Barra de Filtros + Botón */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex flex-wrap gap-3 flex-1 w-full">
              <input
                type="text"
                placeholder="🔍 Buscar"
                className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm flex-1 min-w-[200px] shadow-sm outline-none focus:border-blue-400"
              />
              <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm outline-none cursor-pointer">
                <option>Categoría: Todos</option>
              </select>
              <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm outline-none cursor-pointer">
                <option>Estado: Todos</option>
              </select>
            </div>

            <button
              onClick={() => navigate("/farmacia/solicitudes")}
              className="bg-[#3b82f6] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm flex-shrink-0 w-full sm:w-auto justify-center"
            >
              <PackagePlus size={18} />
              <span>Solicitar Medicamentos</span>
            </button>
          </div>

          {/* Componente Tabla Global */}
          <Table
            columns={columns}
            data={inventoryData}
            onView={handleViewDetails}
            onEdit={handleEdit}
            exportTitle="Inventario Farmacia"
            exportSubtitle="farmacia"
          />
        </div>

        {/* --- COLUMNA LATERAL (Derecha) --- */}
        <div className="w-full xl:w-[320px] flex flex-col gap-6 flex-shrink-0 h-full">
          <div className="flex flex-col gap-3 flex-[3] min-h-0">
            <div className="flex justify-between items-end mb-1">
              <h3 className="font-semibold text-[#304a6d]">
                Alertas / Notificaciones
              </h3>
              <button className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                Ver más
              </button>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              <NotificationCard
                title="Stock crítico"
                message="Ibuprofeno 400mg cuenta con pocas unidades disponibles"
                indicatorColor="bg-red-500"
              />
              <NotificationCard
                title="Lote próximo a vencer"
                message="Lote 98231 (Amoxicilina) vence en 30 días"
                indicatorColor="bg-yellow-400"
              />
              <NotificationCard
                title="Solicitud aprobada"
                message="La solicitud de traslado #122 ha sido despachada"
                indicatorColor="bg-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-[2] min-h-0">
            <div className="flex justify-between items-end mb-1">
              <h3 className="font-semibold text-[#304a6d]">
                Actividad de la farmacia
              </h3>
              <button className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                Ver más
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 overflow-y-auto h-full">
              <ActivityItem
                icon="💊"
                time="11:15 AM"
                description="Dispensación registrada."
              />
              <ActivityItem
                icon="📥"
                time="09:40 AM"
                description="Recepción de traslado desde Bodega."
              />
              <ActivityItem
                icon="📋"
                time="08:30 AM"
                description="Nueva solicitud generada."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventarioFarmacia;
