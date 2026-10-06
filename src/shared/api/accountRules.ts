import type { Account, AccountInput } from './accounts';
export async function passwordHash(password: string, salt: string) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, material, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('');
}
export function validateAccountChange(accounts: Account[], input: AccountInput, actor: string) {
  if (!/^[\p{L}\p{N}._-]{3,50}$/u.test(input.username)) throw new Error('Usa entre 3 y 50 letras, números, puntos o guiones para el usuario.');
  if (!['administrador', 'bodega', 'farmacia'].includes(input.role)) throw new Error('Rol no válido.');
  const old = accounts.find(a => a.username.toLowerCase() === input.username.toLowerCase());
  if ((!old || input.password) && (input.password || '').length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
  if (old?.username === actor && (!input.active || input.role !== old.role)) throw new Error('No puedes desactivar tu cuenta ni cambiar tu propio rol.');
  if (old?.role === 'administrador' && old.active && (!input.active || input.role !== 'administrador') && !accounts.some(a => a.username !== old.username && a.role === 'administrador' && a.active)) throw new Error('Debe permanecer al menos un administrador activo.');
}

export async function authenticateAccount(accounts: Account[], username: string, password: string, role: string) { const account = accounts.find(a => a.username.toLowerCase() === username.trim().toLowerCase() && a.active && a.role === role); return account && await passwordHash(password, account.salt) === account.hash ? { username: account.username, role: account.role } : null; }
