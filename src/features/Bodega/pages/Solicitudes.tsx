import React, { useState } from "react";
import {
    Search, MoreVertical, Clock, Loader2,
    CheckCircle2, AlertTriangle, TrendingUp, TrendingDown
} from "lucide-react";

import PageHeader from "../../../shared/components/Layout/PageHeader";
import Table from "../../../shared/components/Table/Table";
import type { TableColumn } from "../../../shared/components/Table/Table";

type EstadoSolicitud = "Pendiente" | "En proceso" | "Atendida" | "Rechazada";

interface Solicitud {
    id: number;
    solicitud: string;
    area: string;
    fecha: string;
    productos: number;
    solicitante: string;
    estado: EstadoSolicitud;
}

const mockSolicitudes: Solicitud[] = [
    { id: 1, solicitud: "#SOL-0001", area: "Farmacia", fecha: "21 de Agosto 2026", productos: 3, solicitante: "Ana López", estado: "Pendiente" },
    { id: 2, solicitud: "#SOL-0002", area: "Quirófano", fecha: "21 de Agosto 2026", productos: 12, solicitante: "Dr. Martínez", estado: "En proceso" },
    { id: 3, solicitud: "#SOL-0003", area: "Farmacia", fecha: "20 de Agosto 2026", productos: 5, solicitante: "Ana López", estado: "Atendida" },
    { id: 4, solicitud: "#SOL-0004", area: "Hospitalización", fecha: "20 de Agosto 2026", productos: 2, solicitante: "Enf. Ramírez", estado: "Rechazada" },
    { id: 5, solicitud: "#SOL-0005", area: "Farmacia", fecha: "19 de Agosto 2026", productos: 8, solicitante: "Ana López", estado: "Pendiente" },
    { id: 6, solicitud: "#SOL-0006", area: "Farmacia", fecha: "19 de Agosto 2026", productos: 1, solicitante: "Ana López", estado: "Pendiente" },
    { id: 7, solicitud: "#SOL-0007", area: "Laboratorio", fecha: "18 de Agosto 2026", productos: 4, solicitante: "Lic. Gómez", estado: "Atendida" },
];

const Solicitudes: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EstadoSolicitud | "Todas">("Pendiente");
    const [searchTerm, setSearchTerm] = useState("");
    const [areaFilter, setAreaFilter] = useState("Todas");
    const [dateFilter, setDateFilter] = useState("Todos");

    // Lógica de filtrado
    const filteredData = mockSolicitudes.filter(sol => {
        const matchesTab = activeTab === "Todas" || sol.estado === activeTab;
        const matchesArea = areaFilter === "Todas" || sol.area === areaFilter;
        const matchesSearch = sol.solicitud.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sol.solicitante.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesArea && matchesSearch;
    });

    // Conteo dinámico
    const counts = {
        Pendiente: mockSolicitudes.filter(s => s.estado === "Pendiente").length,
        "En proceso": mockSolicitudes.filter(s => s.estado === "En proceso").length,
        Atendida: mockSolicitudes.filter(s => s.estado === "Atendida").length,
        Rechazada: mockSolicitudes.filter(s => s.estado === "Rechazada").length,
    };

    const columns: TableColumn[] = [
        { id: "solicitud", label: "Solicitud", render: (row: Solicitud) => <span className="font-semibold text-slate-800">{row.solicitud}</span> },
        { id: "area", label: "Área", render: (row: Solicitud) => <span className="text-slate-600">{row.area}</span> },
        { id: "fecha", label: "Fecha", render: (row: Solicitud) => <span className="text-slate-600">{row.fecha}</span> },
        { id: "productos", label: "Productos", render: (row: Solicitud) => <span className="text-slate-600">{row.productos}</span> },
        { id: "solicitante", label: "Solicitante", render: (row: Solicitud) => <span className="text-slate-600">{row.solicitante}</span> },
        { id: "estado", label: "Estado", render: (row: Solicitud) => <span className="text-slate-600 capitalize">{row.estado}</span> },
        {
            id: "accion", label: "Acción",
            render: () => (
                <button className="text-slate-400 hover:text-[#304a6d] transition-colors p-1">
                    <MoreVertical size={16} />
                </button>
            )
        }
    ];

    return (
        <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 pb-10 h-full">

            <PageHeader
                header="Bodega / Solicitudes"
                sub="Controla el ingreso, almacenamiento y transferencia de medicamentos hacia farmacia."
            />

            {/* ========================================== */}
            {/* TARJETAS ESTILO DASHBOARD (CON TENDENCIAS) */}
            {/* ========================================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Tarjeta: Pendientes */}
                <button
                    onClick={() => setActiveTab(activeTab === "Pendiente" ? "Todas" : "Pendiente")}
                    className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeTab === "Pendiente"
                            ? "border-[#304a6d] shadow-[0_4px_15px_-3px_rgba(48,74,109,0.15)] ring-1 ring-[#304a6d]"
                            : "border-slate-200 hover:border-slate-300 shadow-sm"
                        }`}
                >
                    <div className="flex justify-between items-start w-full">
                        <span className="text-[13px] font-medium text-slate-600">Solicitudes pendientes</span>
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                            <Clock size={14} />
                        </div>
                    </div>
                    <span className="text-3xl font-bold text-[#1e293b] mt-3 mb-4">{counts.Pendiente}</span>
                    <div className="flex items-center gap-1.5 mt-auto">
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold flex items-center gap-1">
                            <TrendingUp size={10} strokeWidth={3} /> 2
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">más que ayer</span>
                    </div>
                </button>

                {/* Tarjeta: En Proceso */}
                <button
                    onClick={() => setActiveTab(activeTab === "En proceso" ? "Todas" : "En proceso")}
                    className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeTab === "En proceso"
                            ? "border-[#304a6d] shadow-[0_4px_15px_-3px_rgba(48,74,109,0.15)] ring-1 ring-[#304a6d]"
                            : "border-slate-200 hover:border-slate-300 shadow-sm"
                        }`}
                >
                    <div className="flex justify-between items-start w-full">
                        <span className="text-[13px] font-medium text-slate-600">En preparación</span>
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                            <Loader2 size={14} />
                        </div>
                    </div>
                    <span className="text-3xl font-bold text-[#1e293b] mt-3 mb-4">{counts["En proceso"]}</span>
                    <div className="flex items-center gap-1.5 mt-auto">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center gap-1">
                            - 0
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">cambio vs ayer</span>
                    </div>
                </button>

                {/* Tarjeta: Atendidas */}
                <button
                    onClick={() => setActiveTab(activeTab === "Atendida" ? "Todas" : "Atendida")}
                    className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeTab === "Atendida"
                            ? "border-[#304a6d] shadow-[0_4px_15px_-3px_rgba(48,74,109,0.15)] ring-1 ring-[#304a6d]"
                            : "border-slate-200 hover:border-slate-300 shadow-sm"
                        }`}
                >
                    <div className="flex justify-between items-start w-full">
                        <span className="text-[13px] font-medium text-slate-600">Solicitudes atendidas</span>
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                            <CheckCircle2 size={14} />
                        </div>
                    </div>
                    <span className="text-3xl font-bold text-[#1e293b] mt-3 mb-4">{counts.Atendida}</span>
                    <div className="flex items-center gap-1.5 mt-auto">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                            <TrendingUp size={10} strokeWidth={3} /> 12%
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">aumento vs mes anterior</span>
                    </div>
                </button>

                {/* Tarjeta: Rechazadas */}
                <button
                    onClick={() => setActiveTab(activeTab === "Rechazada" ? "Todas" : "Rechazada")}
                    className={`relative p-5 rounded-2xl flex flex-col text-left transition-all bg-white border ${activeTab === "Rechazada"
                            ? "border-[#304a6d] shadow-[0_4px_15px_-3px_rgba(48,74,109,0.15)] ring-1 ring-[#304a6d]"
                            : "border-slate-200 hover:border-slate-300 shadow-sm"
                        }`}
                >
                    <div className="flex justify-between items-start w-full">
                        <span className="text-[13px] font-medium text-slate-600">Solicitudes rechazadas</span>
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                            <AlertTriangle size={14} />
                        </div>
                    </div>
                    <span className="text-3xl font-bold text-[#1e293b] mt-3 mb-4">{counts.Rechazada}</span>
                    <div className="flex items-center gap-1.5 mt-auto">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                            <TrendingDown size={10} strokeWidth={3} /> 3
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">menos que el mes anterior</span>
                    </div>
                </button>

            </div>

            {/* ========================================== */}
            {/* CONTENEDOR PRINCIPAL: FILTROS + TABLA */}
            {/* ========================================== */}
            <div className="flex-1 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col overflow-hidden">

                <div className="flex flex-col sm:flex-row items-center gap-4 px-6 py-5 border-b border-slate-100">

                    <div className="relative w-full sm:w-[280px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-700 outline-none focus:border-[#304a6d] transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Área:</span>
                            <select
                                value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-2 py-2 outline-none cursor-pointer focus:border-[#304a6d] shadow-sm"
                            >
                                <option value="Todas">Todas</option>
                                <option value="Farmacia">Farmacia</option>
                                <option value="Quirófano">Quirófano</option>
                                <option value="Laboratorio">Laboratorio</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Fecha:</span>
                            <select
                                value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-2 py-2 outline-none cursor-pointer focus:border-[#304a6d] shadow-sm"
                            >
                                <option value="Todos">Todos</option>
                                <option value="Hoy">Hoy</option>
                                <option value="Esta semana">Esta semana</option>
                                <option value="Este mes">Este mes</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-2 bg-white overflow-x-auto overflow-y-auto max-h-[500px]">
                    <Table
                        columns={columns}
                        data={filteredData}
                        enableExport={false}
                    />
                </div>

            </div>

        </div>
    );
};

export default Solicitudes;