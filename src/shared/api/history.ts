import axios from 'axios';
import { apiClient } from './client';
import { WAREHOUSE_NAME } from '../config/institution';
import type { Role } from '../types/auth';

export type RecordOrigin = 'Sistema' | 'Importado desde Excel';
export interface HistoricalMovement {
  id: string;
  id_fila: number;
  id_importacion: number;
  fecha: string | null;
  tipo: 'ENTRADA' | 'SALIDA' | 'TRASLADO' | null;
  id_medicamento: number | null;
  medicamento: { id_medicamento: number; codigo: string; nombre: string; indicaciones: string | null; origen_registro: RecordOrigin } | null;
  producto_original: string | null;
  cantidad: string | null;
  unidad: string | null;
  ubicacion: 'BODEGA' | 'FARMACIA' | null;
  destino: string | null;
  lote_original: string | null;
  estado_revision: 'PENDIENTE' | 'VALIDADO';
  motivo_revision: string | null;
  origen_registro: 'Importado desde Excel';
  afecta_stock: false;
  solo_lectura: true;
  fuente: { archivo: string; sha256: string; hoja: string; fila: number; columna: string | null };
}
export interface HistoricalDetail extends HistoricalMovement {
  original: Record<string, unknown>;
  normalizado: Record<string, unknown> | null;
}
export interface HistoryPage { data: HistoricalMovement[]; total: number; page: number; limit: number }
export interface HistoryQuery {
  page: number;
  limit: number;
  desde?: string;
  hasta?: string;
  id_medicamento?: number;
  id_importacion?: number;
  ubicacion?: 'BODEGA' | 'FARMACIA';
  tipo?: 'ENTRADA' | 'SALIDA' | 'TRASLADO';
  estado_revision?: 'PENDIENTE' | 'VALIDADO';
}

export const canReadHistory = (role?: Role) => ['administrador', 'consulta', 'bodega', 'farmacia'].includes(role || '');
export const historyLocation = (location: HistoricalMovement['ubicacion']) => location === 'BODEGA' ? WAREHOUSE_NAME : location === 'FARMACIA' ? 'Farmacia' : 'No documentado';
export const historyProduct = (row: HistoricalMovement) => row.medicamento?.nombre ?? row.producto_original ?? 'Producto por identificar';
export function historyDate(value: string | null): string {
  if (value === null) return 'No documentado';
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : value;
}
export function validateHistoryQuery(query: HistoryQuery): string {
  if (!Number.isSafeInteger(query.page) || query.page < 1 || !Number.isSafeInteger(query.limit) || query.limit < 1 || query.limit > 100)
    return 'La página y el tamaño de página no son válidos.';
  if (query.desde && query.hasta && query.desde > query.hasta) return 'La fecha inicial no puede superar la fecha final.';
  if ([query.id_medicamento, query.id_importacion].some(id => id !== undefined && (!Number.isSafeInteger(id) || id < 1)))
    return 'Selecciona un medicamento o una importación con ID válido.';
  return '';
}
export function historyError(reason: unknown, detail = false): Error {
  if (axios.isCancel(reason)) throw reason;
  if (axios.isAxiosError(reason)) {
    if (reason.response?.status === 404) return new Error(detail
      ? 'El registro no existe o no está disponible para tu perfil.'
      : 'El histórico importado no está disponible en esta versión de la API. Verifica que el backend tenga desplegado /historial-movimientos.');
    if (reason.response?.status === 403) return new Error('Tu perfil no tiene permiso para consultar este histórico.');
    return new Error(reason.response?.data?.error?.message || reason.response?.data?.message || 'No se pudo consultar el histórico. Revisa la conexión e inténtalo de nuevo.');
  }
  return new Error(reason instanceof Error ? reason.message : 'No se pudo cargar el histórico importado.');
}
export async function loadHistory(query: HistoryQuery, signal?: AbortSignal): Promise<HistoryPage> {
  const error = validateHistoryQuery(query);
  if (error) throw new Error(error);
  try {
    const { data } = await apiClient.get<HistoryPage>('/historial-movimientos', { params: query, signal });
    if (!Array.isArray(data?.data) || !Number.isSafeInteger(data.total) || data.total < 0 || data.page !== query.page || data.limit !== query.limit)
      throw new Error('La API devolvió una página de histórico inválida.');
    if (data.data.some(row => !Number.isSafeInteger(row.id_fila) || row.id_fila < 1 || row.id !== `HIST-${row.id_fila}` || row.afecta_stock !== false || row.solo_lectura !== true))
      throw new Error('La API devolvió registros sin identificación de histórico de solo lectura.');
    return data;
  } catch (reason) { throw historyError(reason); }
}
export async function loadHistoryDetail(id: number, signal?: AbortSignal): Promise<HistoricalDetail> {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('El ID del registro no es válido.');
  try {
    const { data } = await apiClient.get<{ data: HistoricalDetail }>(`/historial-movimientos/${id}`, { signal });
    if (!data?.data || data.data.id_fila !== id || data.data.id !== `HIST-${id}` || data.data.afecta_stock !== false || data.data.solo_lectura !== true || !data.data.original || typeof data.data.original !== 'object')
      throw new Error('La API devolvió un detalle de histórico inválido.');
    return data.data;
  } catch (reason) { throw historyError(reason, true); }
}
