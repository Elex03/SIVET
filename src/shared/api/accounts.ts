import { passwordHash, validateAccountChange } from './accountRules';
export { passwordHash, validateAccountChange } from './accountRules';
import { apiClient, apiUrl } from './client';
import type { Role } from '../types/auth';
export interface Account { username: string; role: Role; active: boolean; salt: string; hash: string }
export type AccountInput = { username: string; role: Role; active: boolean; password?: string };
const key = 'sivet-accounts-v1';
export async function readAccounts(): Promise<Account[]> {
  if (apiUrl) return (await apiClient.get<Account[]>('/users')).data;
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);
  const accounts = (await apiClient.get<Account[]>('data/users.json')).data;
  localStorage.setItem(key, JSON.stringify(accounts)); return accounts;
}
export async function saveAccount(input: AccountInput, actor: string) {
  if (apiUrl) { await apiClient.post('/users', input); return; }
  const accounts = await readAccounts();
  if (!accounts.some(a => a.username === actor && a.active && a.role === 'administrador')) throw new Error('Solo un administrador activo puede gestionar usuarios.');
  validateAccountChange(accounts, input, actor);
  const old = accounts.find(a => a.username.toLowerCase() === input.username.toLowerCase());
  const salt = input.password ? crypto.randomUUID() : old!.salt;
  const record: Account = { username: old?.username || input.username, role: input.role, active: input.active, salt, hash: input.password ? await passwordHash(input.password, salt) : old!.hash };
  localStorage.setItem(key, JSON.stringify([...accounts.filter(a => a.username !== record.username), record]));
  window.dispatchEvent(new Event('sivet-accounts'));
}
