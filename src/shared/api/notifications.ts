import type { Notification } from './domain';
import type { User } from '../types/auth';

export const notificationReader = (user: Pick<User, 'role' | 'username'>) => `${user.role}:${user.username}`;
export const ownsNotification = (notice: Notification, user: User) => notice.ownerId !== undefined
  ? notice.ownerId === user.id : user.role === 'administrador' || notice.rol === user.role;
export const isUnreadNotification = (notice: Notification, user: User) => !notice.leidaPor.includes(notificationReader(user));
export function notificationCategory(notice: Notification): 'Incidencias' | 'Traslados' | 'Solicitudes' {
  const text = `${notice.categoria || ''} ${notice.titulo}`;
  return /incidencia|devol|diferencia|rechaz/i.test(text) ? 'Incidencias'
    : /env[ií]|traslad|recep|recibid|entrega/i.test(text) ? 'Traslados' : 'Solicitudes';
}
export class NotificationReadError extends Error {
  completedIds: string[];
  constructor(completedIds: string[], total: number, cause: unknown) {
    super(`Se marcaron ${completedIds.length} de ${total} avisos. No se pudo confirmar la lectura de los demás. Actualiza la bandeja antes de reintentar. ${cause instanceof Error ? cause.message : 'No se pudo completar la lectura.'}`, { cause });
    this.completedIds = completedIds;
  }
}
export async function readNotificationsSequentially(ids: string[], read: (id: string) => Promise<unknown>): Promise<void> {
  const unique = [...new Set(ids)];
  const completed: string[] = [];
  for (const id of unique) {
    try { await read(id); completed.push(id); }
    catch (reason) { throw new NotificationReadError(completed, unique.length, reason); }
  }
}
