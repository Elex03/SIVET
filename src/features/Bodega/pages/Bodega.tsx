import React from "react";
import { useNavigate } from "react-router-dom";
import { Package, Clock, AlertTriangle, PackagePlus } from "lucide-react"; 

import PageHeader from "../../../shared/components/Layout/PageHeader";
import SummaryCard from "../../../shared/components/charts/SummaryCard";
import NotificationCard from "../../../shared/components/Layout/NotificationCard";
import ActivityItem from "../../../shared/components/Layout/ActivityItem";
import Table from "../../../shared/components/Table/Table"; 
import type  { TableColumn } from "../../../shared/components/Table/Table"

import UNALOGO from '../../../shared/assets/images/UNA.png'

const Bodega: React.FC = () => {
  const navigate = useNavigate();

  const columns: TableColumn[] = [
    {
      id: "imagen",
      label: "", // Lo dejamos vacío o puedes poner "Img"
      render: (row) => (
        <img 
          src={row.imagen || UNALOGO} 
          alt={row.nombre} 
          className="w-10 h-10 rounded-md object-cover border border-gray-200 bg-white"
          // Si la URL que viene de la BD está rota, carga la de la UNA
          onError={(e) => {
            (e.target as HTMLImageElement).src = UNALOGO;
          }}
        />
      )
    },
    { id: "codigo", label: "Código" },
    { id: "nombre", label: "Nombre" },
    { id: "categoria", label: "Categoría" },
    { id: "principioActivo", label: "Principio Activo" },
    { id: "existencia", label: "Existencia" },
    { id: "estado", label: "Estado" },
  ];

  // 2. Data de prueba (Nota la propiedad "imagen")
  const inventoryData = [
    {
      id: 1, 
      imagen: "https://via.placeholder.com/150", // Simulando un medicamento con imagen
      codigo: "MED-001",
      nombre: "Oxitetraciclina 20%",
      categoria: "Antibiótico",
      principioActivo: "Oxitetraciclina",
      existencia: "120 uni",
      estado: "Disponible",
    },
    {
      id: 2,
      imagen: "", // Vacío, tomará el logo de la UNA
      codigo: "MED-002",
      nombre: "Prednisona",
      categoria: "Corticoide",
      principioActivo: "Prednisona",
      existencia: "15 uni",
      estado: "Bajo stock",
    },
  ];

  // 3. Funciones de acción para la tabla
  const handleViewDetails = (row: any) => {
    navigate(`/bodega/medicamento/${row.id}`); 
  };

  const handleEdit = (row: any) => {
    console.log("Editar medicamento:", row.nombre);
    // Lógica para abrir modal de edición
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col h-full">
      
      <PageHeader 
        header="Bodega" 
        sub="Controla el ingreso, almacenamiento y transferencia de medicamentos hacia farmacia." 
      />
      
      <div className="flex flex-col xl:flex-row gap-8 w-full flex-1 min-h-0">
        
        {/* --- COLUMNA PRINCIPAL --- */}
        <div className="flex-1 flex flex-col min-w-0">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <SummaryCard
              title="Total medicamentos en bodega"
              value="540"
              icon={Package}
              trendValue="12%"
              trendType="up"
              trendText="aumento vs mes anterior"
            />
            <SummaryCard
              title="Medicamentos próximos a vencerse"
              value="4"
              icon={Clock}
              trendValue="2"
              trendType="down"
              trendText="menos que el mes anterior"
            />
            <SummaryCard
              title="Medicamentos próximos a agotarse"
              value="32"
              icon={AlertTriangle}
              trendValue="5%"
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
                <option>Categoría: Analgésicos</option>
              </select>
              <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm outline-none cursor-pointer">
                <option>Estado: Disponible</option>
              </select>
              <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm outline-none cursor-pointer">
                <option>Lote: Todos</option>
              </select>
            </div>

            <button 
              onClick={() => navigate("/bodega/pedidos/recepcion")}
              className="bg-[#3b82f6] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm flex-shrink-0 w-full sm:w-auto justify-center"
            >
              <PackagePlus size={18} />
              <span>Recibir Pedido</span>
            </button>

          </div>

          {/* Componente Tabla Global */}
          <Table 
            columns={columns} 
            data={inventoryData} 
            onView={handleViewDetails}
            onEdit={handleEdit}
            exportTitle="Tabla"
            exportSubtitle="tabla"
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
                title="Medicamento próximo a vencer"
                message="Lote 4542122 (Prednisona) próxima a vencimiento"
                indicatorColor="bg-yellow-400"
              />
              <NotificationCard
                title="Medicamento próximo a agotarse"
                message="Ranitidina 5 unidades disponibles"
                indicatorColor="bg-red-500"
              />
              <NotificationCard
                title="Revisión de inventario"
                message="Lote 112330 requiere validación de stock físico."
                indicatorColor="bg-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-[2] min-h-0">
            <div className="flex justify-between items-end mb-1">
              <h3 className="font-semibold text-[#304a6d]">
                Actividad de la bodega
              </h3>
              <button className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                Ver más
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4 overflow-y-auto h-full">
              <ActivityItem icon="📦" time="10:45 AM" description="Se ingresó pedido." />
              <ActivityItem icon="🚚" time="10:12 AM" description="Transferencia SOL #123 a Farmacia." />
              <ActivityItem icon="⚠️" time="09:30 AM" description="Merma registrada." />
              <ActivityItem icon="📥" time="08:15 AM" description="Devolución recibida." />
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default Bodega;