import MedicationForm from "./MedicationForm";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../shared/components/Layout/PageHeader";
import Modal from "../../shared/components/Layout/Modal";
import Table from "../../shared/components/Table/Table";
import DataFeedback from "../../shared/components/Layout/DataFeedback";
import { useSivet } from "../../shared/api/useSivet";
import { newId } from "../../shared/api/domain";
import type { CatalogRecord } from "../../shared/api/domain";

const generalTabs = [
  { id: "medicamentos", label: "Medicamentos" },
  { id: "terapeuticas", label: "Acción Terapéutica" },
  { id: "presentaciones", label: "Presentaciones" },
  { id: "unidades", label: "Unidades de inventario" },
  { id: "marcas", label: "Marcas / Laboratorios" },
  { id: "categorias", label: "Categorías" },
  { id: "proveedores", label: "Proveedores" },
];
import { inputClass, buttonClass } from "../../shared/styles/formStyles";
const blank = (tipo: string): CatalogRecord => ({
  id: newId(),
  tipo,
  nombre: "",
  codigo: "",
  descripcion: "",
  activo: true,
  categoria: "",
  accion: "",
  marca: "",
  unidad: "",
  minimo: 0,
  correos: [],
  telefonos: [],
});
export default function CatalogManager({ locationsOnly = false }: { locationsOnly?: boolean }) {
  const tabs = locationsOnly ? [{ id: "ubicaciones", label: "Ubicaciones de destino" }] : [...generalTabs, { id: "ubicaciones", label: "Ubicaciones de destino" }];
  const state = useSivet();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some((t) => t.id === params.get("tipo"))
    ? params.get("tipo")!
    : tabs[0].id;
  const [search, setSearch] = useState("");
  const [record, setRecord] = useState<CatalogRecord | null>(null);
  const [emails, setEmails] = useState("");
  const [phones, setPhones] = useState("");
  const edit = (r: CatalogRecord) => {
    setRecord({ ...r });
    setEmails(r.correos.join("\n"));
    setPhones(r.telefonos.join("\n"));
  };
  const field = (key: keyof CatalogRecord, value: string | boolean | number) =>
    setRecord((r) => r && { ...r, [key]: value });
  const rows = state.data.catalogos.filter(
    (r) =>
      r.tipo === tab &&
      `${r.nombre} ${r.codigo} ${r.correos.join(" ")} ${r.telefonos.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="screen-page max-w-[1600px] mx-auto flex flex-col gap-6 pb-10">
      <PageHeader
        header={locationsOnly ? "Farmacia · Ubicaciones" : "Catálogos del Sistema"}
        sub={locationsOnly ? "Localidades que reciben medicamentos de Farmacia." : "Administración de medicamentos, clasificaciones y proveedores."}
      />
      <DataFeedback {...state} /><div className="screen-body" tabIndex={0} role="region" aria-label="Contenido de la pantalla">
      <div className="flex flex-col lg:flex-row gap-6 min-w-0">
        <nav
          aria-label="Catálogos"
          className="bg-white border border-slate-100 rounded-2xl p-4 lg:w-64 shrink-0 h-fit flex flex-wrap lg:flex-col gap-2"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setParams({ tipo: t.id });
                setSearch("");
              }}
              className={`p-3 rounded-xl text-sm font-semibold text-left ${tab === t.id ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <section className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 screen-toolbar">
            <h2 className="font-bold text-[#304a6d]">
              {tabs.find((t) => t.id === tab)?.label}
            </h2>
            <input
              aria-label="Buscar registros"
              placeholder="Buscar registro…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputClass} toolbar-search`}
            />
            <button
              className={`${buttonClass} flex items-center justify-center gap-2 shrink-0 toolbar-actions`}
              onClick={() => edit(blank(tab))}
            >
              <Plus size={16} />
              Nuevo registro
            </button>
          </div>
          <Table
            exportTitle={tabs.find((t) => t.id === tab)?.label}
            columns={[
              { id: "nombre", label: "Nombre" },
              ...(tab === "medicamentos"
                ? [
                    { id: "codigo", label: "Código" },
                    { id: "unidad", label: "Unidad" },
                    { id: "marca", label: "Marca" },
                  ]
                : []),
              ...(tab === "proveedores"
                ? [
                    {
                      id: "correos",
                      label: "Correos",
                      render: (r: CatalogRecord) => (
                        <div className="flex flex-col gap-1">
                          {r.correos.map((email) => (
                            <a
                              key={email}
                              className="text-blue-600 break-all"
                              href={`mailto:${email}`}
                            >
                              {email}
                            </a>
                          ))}
                        </div>
                      ),
                    },
                    {
                      id: "telefonos",
                      label: "Teléfonos",
                      render: (r: CatalogRecord) => (
                        <div className="flex flex-col gap-1">
                          {r.telefonos.map((phone) => (
                            <a
                              key={phone}
                              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                            >
                              {phone}
                            </a>
                          ))}
                        </div>
                      ),
                    },
                  ]
                : [{ id: "descripcion", label: "Descripción" }]),
              { id: "estado", label: "Estado" },
              {
                id: "editar",
                label: "Editar",
                render: (r: CatalogRecord) => (
                  <button
                    title={`Editar ${r.nombre}`}
                    className="p-2 text-[#304a6d]"
                    onClick={() => edit(r)}
                  >
                    <Pencil size={17} />
                  </button>
                ),
              },
            ]}
            data={rows.map((r) => ({
              ...r,
              estado: r.activo ? "Activo" : "Inactivo",
            }))}
          />
        </section>
      </div>
      <Modal
        isOpen={!!record && record.tipo !== "medicamentos"}
        onClose={() => !state.pending && setRecord(null)}
        title="Registro de catálogo"
      >
        {record && (
          <form
            className="flex flex-col gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const split = (v: string) => [
                ...new Set(
                  v
                    .split(/[\n,;]/)
                    .map((x) => x.trim())
                    .filter(Boolean),
                ),
              ];
              if (
                await state.mutate({
                  type: "catalog.save",
                  record: {
                    ...record,
                    nombre: record.nombre.trim(),
                    codigo: record.codigo.trim(),
                    correos: split(emails),
                    telefonos: split(phones),
                  },
                })
              )
                setRecord(null);
            }}
          >
            <label className="text-sm font-semibold text-slate-600">
              Nombre
              <input
                autoFocus
                required
                maxLength={150}
                className={inputClass}
                value={record.nombre}
                onChange={(e) => field("nombre", e.target.value)}
              />
            </label>
            {tab === "medicamentos" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <label>
                  Código
                  <input
                    required
                    className={inputClass}
                    value={record.codigo}
                    onChange={(e) => field("codigo", e.target.value)}
                  />
                </label>
                <label>
                  Unidad de inventario
                  <input
                    required
                    placeholder="Ej. frascos, tabletas, cajas"
                    className={inputClass}
                    value={record.unidad}
                    onChange={(e) => field("unidad", e.target.value)}
                  />
                </label>
                {(
                  [
                    ["categoria", "categorias", "Categoría"],
                    ["accion", "terapeuticas", "Acción terapéutica"],
                    ["marca", "marcas", "Marca"],
                  ] as const
                ).map(([key, tipo, label]) => (
                  <label key={key}>
                    {label}
                    <select
                      className={inputClass}
                      value={record[key]}
                      onChange={(e) => field(key, e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {state.data.catalogos
                        .filter(
                          (r) =>
                            r.tipo === tipo &&
                            (r.activo || r.nombre === record[key]),
                        )
                        .map((r) => (
                          <option key={r.id}>{r.nombre}</option>
                        ))}
                    </select>
                  </label>
                ))}
                <label>
                  Stock mínimo
                  <input
                    type="number"
                    min={0}
                    required
                    className={inputClass}
                    value={record.minimo}
                    onChange={(e) => field("minimo", Number(e.target.value))}
                  />
                </label>
              </div>
            )}
            {tab === "proveedores" ? (
              <fieldset className="border border-slate-200 rounded-xl p-4 grid sm:grid-cols-2 gap-4">
                <legend className="font-bold text-[#304a6d] px-2">
                  Contactos
                </legend>
                <label>
                  Correos electrónicos
                  <textarea
                    placeholder="Un correo por línea"
                    className={inputClass}
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                  />
                </label>
                <label>
                  Números telefónicos
                  <textarea
                    placeholder="Un número por línea"
                    className={inputClass}
                    value={phones}
                    onChange={(e) => setPhones(e.target.value)}
                  />
                </label>
              </fieldset>
            ) : (
              <label>
                Descripción
                <textarea
                  className={inputClass}
                  value={record.descripcion}
                  onChange={(e) => field("descripcion", e.target.value)}
                />
              </label>
            )}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={record.activo}
                onChange={(e) => field("activo", e.target.checked)}
              />
              Registro activo
            </label>
            {state.error && (
              <p role="alert" className="text-rose-600">
                {state.error}
              </p>
            )}
            <button
              disabled={state.pending}
              className={`${buttonClass} self-end`}
            >
              {state.pending ? "Guardando…" : "Guardar registro"}
            </button>
          </form>
        )}
      </Modal>
      <Modal
        isOpen={record?.tipo === "medicamentos"}
        onClose={() => setRecord(null)}
        title={
          state.data.catalogos.some((p) => p.id === record?.id)
            ? "Editar medicamento"
            : "Agregar nuevo medicamento"
        }
      >
        {record?.tipo === "medicamentos" && (
          <MedicationForm
            key={record.id}
            initial={record}
            onSave={() => setRecord(null)}
            onCancel={() => setRecord(null)}
          />
        )}
      </Modal>
    </div></div>
  );
}
