import type { Role } from "../types/auth";
import type { Command, Database } from "./domain";
export const canEditMedication = (role?: Role) =>
  role === "administrador" || role === "bodega";
export function canWriteApiCatalog(role: Role | undefined, type: string) {
  return (
    role === "administrador" ||
    (role === "bodega" &&
      [
        "medicamentos",
        "marcas",
        "categorias",
        "terapeuticas",
        "proveedores",
      ].includes(type)) ||
    (role === "farmacia" && type === "ubicaciones")
  );
}
export function assertPreparationPermission(
  role: Role | undefined,
  command: Command,
) {
  if (role === "consulta" && command.type !== "notification.read")
    throw new Error("Este perfil solo permite consultar información.");
  if (role === "preparador" && command.type !== "request.prepare")
    throw new Error("Este perfil solo puede preparar pedidos aprobados.");
  if (
    command.type === "request.prepare" &&
    !["administrador", "bodega", "preparador"].includes(role || "")
  )
    throw new Error("No tienes permiso para preparar pedidos.");
}
export function assertCatalogPermission(
  role: Role | undefined,
  command: Command,
  db: Database,
) {
  if (command.type !== "catalog.save") return;
  const previous = db.catalogos.find((r) => r.id === command.record.id);
  if (
    !role ||
    role === "preparador" ||
    (role === "farmacia" &&
      (command.record.tipo !== "ubicaciones" ||
        (previous && previous.tipo !== "ubicaciones")))
  )
    throw new Error(
      "Tu usuario no tiene permiso para modificar este catálogo.",
    );
  if (previous && previous.tipo !== command.record.tipo)
    throw new Error("No se puede cambiar el tipo de catálogo.");
}
