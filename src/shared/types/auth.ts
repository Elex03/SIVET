export type Role = "administrador" | "bodega" | "farmacia";

export interface User {
  username: string;
  role: Role;
}