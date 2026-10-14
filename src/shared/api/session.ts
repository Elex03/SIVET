import type { Role, User } from "../types/auth";
export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}
const key = "sivet-api-session";
let tokens: Tokens | null = (() => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
})();
export const getTokens = () => tokens;
export function saveTokens(value: Tokens | null) {
  tokens = value;
  if (value) sessionStorage.setItem(key, JSON.stringify(value));
  else sessionStorage.removeItem(key);
}
export function expireSession() {
  saveTokens(null);
  window.dispatchEvent(new Event("sivet-session-expired"));
}
export function mapRole(role: string): Role {
  const roles: Record<string, Role> = {
    ADMIN: "administrador",
    BODEGA: "bodega",
    FARMACIA: "farmacia",
    PREPARADOR: "preparador",
    CONSULTA: "consulta",
  };
  if (!roles[role]) throw new Error("Rol no reconocido por la aplicación.");
  return roles[role];
}
export function mapProfile(raw: {
  id_usuario: number;
  username: string;
  rol: string;
}): User {
  return { id: raw.id_usuario, username: raw.username, role: mapRole(raw.rol) };
}
