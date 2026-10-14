export type Role = "administrador" | "bodega" | "farmacia" | "preparador" | "consulta";

export interface User {
  id?: number;
  username: string;
  role: Role;
}
