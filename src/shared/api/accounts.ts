import { addDemoPreparer, passwordHash, validateAccountChange } from './accountRules';
export { passwordHash, validateAccountChange } from './accountRules';
import { apiClient, apiUrl } from './client';
import type { Role } from '../types/auth';
import { apiData } from './client';
import { allPages } from './server';
import { mapRole } from './session';
export interface Account { id?: number; nombre?:string; apellido?:string; correo?:string; username: string; role: Role; active: boolean; salt: string; hash: string }
export type AccountInput = { id?:number; nombre?:string; apellido?:string; correo?:string; username: string; role: Role; active: boolean; password?: string };
const key = 'sivet-accounts-v1';
export async function readAccounts(): Promise<Account[]> {
  if (apiUrl) { const [rows,roles]=await Promise.all([allPages('/usuarios'),allPages('/roles')]);return rows.map(r=>({id:r.id_usuario,username:r.username,nombre:r.nombre,apellido:r.apellido,correo:r.correo || '',role:mapRole(roles.find(role=>role.id_rol===r.id_rol)?.nombre),active:r.estado,salt:'',hash:''})); }
  const saved = localStorage.getItem(key);
  if (saved) {
    const accounts: Account[] = JSON.parse(saved);
    if (accounts.some(a => a.username.toLowerCase() === 'preparador')) return accounts;
    const seeds = (await apiClient.get<Account[]>('data/users.json')).data;
    // Re-read after the request so an administrative change made while loading wins.
    const current: Account[] = JSON.parse(localStorage.getItem(key) || saved);
    const updated = addDemoPreparer(current, seeds);
    if (updated !== current) localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }
  const accounts = (await apiClient.get<Account[]>('data/users.json')).data;
  localStorage.setItem(key, JSON.stringify(accounts)); return accounts;
}
export async function saveAccount(input: AccountInput, actor: string) {
  if (apiUrl) {
    if(!input.nombre?.trim() || !input.apellido?.trim())throw new Error('Nombre y apellido son obligatorios.');
    if(input.password && input.password.length<12)throw new Error('La contraseña requiere al menos 12 caracteres.');
    const roles=await allPages('/roles');const names={administrador:'ADMIN',bodega:'BODEGA',farmacia:'FARMACIA',preparador:'PREPARADOR',consulta:'CONSULTA'};
    const role=roles.find(r=>r.nombre===names[input.role]);if(!role)throw new Error('Rol no disponible.');
    const payload={username:input.username,nombre:input.nombre.trim(),apellido:input.apellido.trim(),correo:input.correo?.trim() || null,id_rol:role.id_rol,estado:input.active};
    if(input.id){await apiData(`/usuarios/${input.id}`,'PATCH',payload);if(input.password)await apiData(`/usuarios/${input.id}/password`,'PATCH',{password_nueva:input.password});}
    else await apiData('/usuarios','POST',{...payload,password:input.password});
    return;
  }
  const accounts = await readAccounts();
  if (!accounts.some(a => a.username === actor && a.active && a.role === 'administrador')) throw new Error('Solo un administrador activo puede gestionar usuarios.');
  validateAccountChange(accounts, input, actor);
  const old = accounts.find(a => a.username.toLowerCase() === input.username.toLowerCase());
  const salt = input.password ? crypto.randomUUID() : old!.salt;
  const record: Account = { username: old?.username || input.username, role: input.role, active: input.active, salt, hash: input.password ? await passwordHash(input.password, salt) : old!.hash };
  localStorage.setItem(key, JSON.stringify([...accounts.filter(a => a.username !== record.username), record]));
  window.dispatchEvent(new Event('sivet-accounts'));
}
