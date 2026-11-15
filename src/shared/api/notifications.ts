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
export function groupNotifications(notices: Notification[], user: User) {
  const groups = new Map<string, { id: string; title: string; category: string; role: string; latest: string; unread: number; notices: Notification[] }>();
  for (const notice of [...notices].sort((a, b) => b.fecha.localeCompare(a.fecha))) {
    const category = notificationCategory(notice);
    const date = new Date(notice.fecha).toLocaleDateString('en-CA', { timeZone: 'America/Managua' });
    // Never merge unrelated requests or accounts, and retain every event inside the group.
    const owner = notice.ownerId === undefined ? 'role' : String(notice.ownerId);
    const key = JSON.stringify([notice.rol, owner, notice.solicitudId || [category, date, notice.titulo]]);
    const group = groups.get(key) || { id: key, title: notice.solicitudId ? `Solicitud ${notice.solicitudId}` : notice.titulo, category, role: notice.rol, latest: notice.fecha, unread: 0, notices: [] };
    group.notices.push(notice);
    if (ownsNotification(notice, user) && isUnreadNotification(notice, user)) group.unread++;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => Number(b.unread > 0) - Number(a.unread > 0) || b.latest.localeCompare(a.latest));
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
