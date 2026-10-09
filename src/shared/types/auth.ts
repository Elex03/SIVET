export type Role = "administrador" | "bodega" | "farmacia" | "preparador";

export interface User {
  username: string;
  role: Role;
}
