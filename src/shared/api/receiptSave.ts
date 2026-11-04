import { apiData } from './client';
import { apiCancelled, apiStatus, apiCause } from './apiControl';
import { dateOnly, decimal, mapReceipt, type ApiRow } from './apiMapping';
import type { Command, Database, Receipt } from './domain';

export class ReceiptConflictError extends Error {
  currentReceipt: Receipt;
  constructor(message: string, currentReceipt: Receipt) { super(message); this.currentReceipt = currentReceipt; }
}
export const receiptIds = new Map<string, number>();
interface Attempt {
  number: string; id?: number; version?: number; inputVersion?: number; creationAttempted?: boolean;
  resolvedSignature?: string; lots?: ApiRow[]; savedSignature?: string; attachment?: string; attachmentUncertain?: boolean;
}
const attempts = new Map<string, Attempt>();
if (typeof window !== 'undefined') window.addEventListener?.('sivet-session', () => { attempts.clear(); receiptIds.clear(); });
type List = (path: string, params?: Record<string, unknown>) => Promise<ApiRow[]>;
type Upload = (path: string, content: string, name: string) => Promise<void>;
const idOf = (value: string) => {
  const id = Number(value.split(':').at(-1));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('Selecciona un medicamento existente.');
  return id;
};
const uncertain = (reason: unknown) => {
  const cause = apiCause(reason) as { response?: { data?: { error?: { code?: string } } } };
  if (cause?.response?.data?.error?.code === 'LOT_EXPIRED') return false;
  const status = apiStatus(reason);
  return !apiCancelled(reason) && (status === undefined || [409, 429].includes(status) || status >= 500);
};
const conflict = (current: ApiRow) => new ReceiptConflictError(`La recepción cambió en el servidor (versión ${current.version}). Tus datos se conservaron. Revisa el borrador actual antes de continuar.`, mapReceipt(current));

export function receiptLotInputs(receipt: Receipt, db: Database, complete: boolean) {
  if (receipt.items.length > 250) throw new Error('Una recepción admite como máximo 250 lotes.');
  if (complete && !receipt.items.length) throw new Error('Agrega al menos un medicamento.');
  const keys = new Set<string>(), codes = new Set<string>();
  return receipt.items.map(item => {
    const medication = db.catalogos.find(p => p.id === item.productoId && p.tipo === 'medicamentos' && p.activo);
    if (!medication) throw new Error('El medicamento no existe o está inactivo.');
    const lot = item.lote.trim();
    if (!lot) throw new Error('El número de lote es obligatorio en cada línea. El código QR/barras es opcional.');
    const key = `${item.productoId}:${lot.toLocaleUpperCase('es')}`;
    if (keys.has(key)) throw new Error(`El medicamento y lote ${lot} están repetidos. Corrige las líneas; no se combinarán cantidades.`);
    keys.add(key);
    const code = item.codigoLote?.trim() || null;
    if (code && codes.has(code)) throw new Error('Un código QR/barras no puede identificar lotes diferentes.');
    if (code) codes.add(code);
    if (!Number.isFinite(item.cantidad) || item.cantidad < 0 || (complete && item.cantidad <= 0)) throw new Error('Revisa la cantidad de cada producto.');
    if (Number(decimal(item.cantidad)) !== item.cantidad) throw new Error('La cantidad debe poder expresarse con hasta 12 decimales, sin redondearla.');
    if (!item.vencimiento && !(receipt.tipoIngreso === 'DONACION' && item.vencimiento === null)) throw new Error('Indica vencimiento; solo una donación admite fecha desconocida.');
    return { id_medicamento: idOf(item.productoId), numero_lote: lot, fecha_vencimiento: item.vencimiento || null,
      origen_ingreso: receipt.tipoIngreso || 'COMPRA', codigo_lote: code,
      ...(item.fabricacion ? { fecha_fabricacion: item.fabricacion } : {}) };
  });
}

function samePayload(current: ApiRow, payload: ApiRow): boolean {
  const pairs = (lines: ApiRow[]) => lines.map(d => `${d.id_lote}:${decimal(Number(d.cantidad))}`).sort();
  return current.numero_recepcion === payload.numero_recepcion && (current.tipo_ingreso || 'COMPRA') === payload.tipo_ingreso &&
    (current.donante || null) === payload.donante && (current.id_proveedor || null) === payload.id_proveedor &&
    decimal(Number(current.total || 0)) === payload.total && dateOnly(current.fecha_recepcion) === payload.fecha_recepcion &&
    JSON.stringify(pairs(current.detalle_recepciones_id_recepcion_list || [])) === JSON.stringify(pairs(payload.detalles));
}

export async function saveReceipt(command: Extract<Command, { type: 'receipt.create' | 'receipt.draft' }>, db: Database, list: List, upload: Upload) {
  const r = command.receipt;
  const complete = command.type === 'receipt.create';
  if (r.items.length > 250) throw new Error('Una recepción admite como máximo 250 lotes.');
  if (complete && !r.items.length) throw new Error('Agrega al menos un medicamento.');
  const keys = new Set<string>(), codes = new Set<string>();
  for (const item of r.items) {
    const key = item.productoId + ':' + item.lote.trim().toLocaleUpperCase('es');
    if (keys.has(key)) throw new Error('Medicamento y lote repetidos. No se combinarán cantidades.');
    keys.add(key);
    const code = item.codigoLote?.trim();
    if (code && codes.has(code)) throw new Error('Un código QR/barras no puede identificar lotes diferentes.');
    if (code) codes.add(code);
    if (!Number.isFinite(item.cantidad) || item.cantidad < 0 || (complete && item.cantidad <= 0)) throw new Error('Revisa la cantidad de cada producto.');
    if (Number(decimal(item.cantidad)) !== item.cantidad) throw new Error('La cantidad debe poder expresarse con hasta 12 decimales, sin redondearla.');
  }
  const reference = r.referencia || r.documento?.trim() || r.id;
  const known = db.recepciones.find(receipt => receipt.id === r.id || receipt.referencia === reference);
  let attempt = attempts.get(r.id);
  if (!attempt || (r.version !== undefined && r.version !== attempt.inputVersion)) {
    attempt = { number: attempt?.number || known?.referencia || r.referencia || r.documento?.trim() || r.id,
      id: attempt?.id || (known ? idOf(known.id) : receiptIds.get(r.id)), version: r.version ?? known?.version, inputVersion: r.version };
    attempts.set(r.id, attempt);
  }
  const state = attempt;
  const base = { tipo_ingreso: r.tipoIngreso || 'COMPRA', donante: r.tipoIngreso === 'DONACION' ? r.donante?.trim() || null : null,
    id_proveedor: r.tipoIngreso === 'DONACION' ? null : r.proveedorId ? idOf(r.proveedorId) : null,
    total: decimal(r.total ?? 0), numero_recepcion: state.number, fecha_recepcion: r.fecha };
  const signature = JSON.stringify({ ...base, lineas: r.items.map(i => ({ productoId: i.productoId, apiLoteId: i.apiLoteId, lote: i.lote.trim(), vencimiento: i.vencimiento || null, fabricacion: i.fabricacion || null, codigo: i.codigoLote?.trim() || null, cantidad: decimal(i.cantidad) })) });
  const readCurrent = () => apiData<ApiRow>(`/recepciones/${state.id}`);
  const remember = (saved: ApiRow) => {
    if (!Number.isSafeInteger(saved.id_recepcion) || !Number.isSafeInteger(saved.version)) throw new Error('La API no devolvió el ID y versión de la recepción. Reintenta para reconciliarla.');
    state.id = saved.id_recepcion; state.version = saved.version; receiptIds.set(r.id, saved.id_recepcion);
  };
  const findCreated = async () => {
    const matches = (await list('/recepciones', { q: state.number })).filter(item => item.numero_recepcion === state.number);
    if (matches.length > 1) throw new Error('Hay varias recepciones con el mismo número. Revisa los datos antes de continuar.');
    return matches.length ? apiData<ApiRow>(`/recepciones/${matches[0].id_recepcion}`) : undefined;
  };
  const current = state.id ? await readCurrent() : state.creationAttempted ? await findCreated() : undefined;
  if (current) {
    if (current.estado === 'COMPLETADA') {
      const lines: ApiRow[] = current.detalle_recepciones_id_recepcion_list || [];
      const matched = r.items.map(item => lines.find(line => line.lotes_id_lote?.id_medicamento === idOf(item.productoId) &&
        line.lotes_id_lote?.numero_lote?.trim().toLocaleUpperCase('es') === item.lote.trim().toLocaleUpperCase('es') &&
        dateOnly(line.lotes_id_lote?.fecha_vencimiento) === (item.vencimiento || null) &&
        dateOnly(line.lotes_id_lote?.fecha_fabricacion) === (item.fabricacion || null) &&
        (!item.codigoLote?.trim() || line.lotes_id_lote?.codigo_lote === item.codigoLote.trim())));
      if (matched.every(Boolean) && samePayload(current, { ...base, detalles: matched.map((line, index) => ({ id_lote: line!.id_lote, cantidad: decimal(r.items[index].cantidad) })) })) return;
      throw conflict(current);
    }
    if (state.savedSignature === signature && state.lots) {
      const payload = { ...base, detalles: state.lots.map((lot, index) => ({ id_lote: lot.id_lote, cantidad: decimal(r.items[index].cantidad) })) };
      if (!samePayload(current, payload)) throw conflict(current);
      remember(current);
      if (current.estado === 'COMPLETADA') return;
    } else if (state.id && state.version !== undefined && current.version !== state.version) {
      throw conflict(current);
    }
    if (current.estado !== 'BORRADOR' && current.estado !== 'COMPLETADA') throw conflict(current);
  }
  const persisted: Receipt['items'] = current ? mapReceipt(current).items : [];
  const plan = r.items.map(item => {
    const saved = item.apiLoteId ? persisted.find(line => line.apiLoteId === item.apiLoteId) : undefined;
    const sameIdentity = saved && saved.productoId === item.productoId && saved.lote.trim() === item.lote.trim();
    if (!sameIdentity) return undefined;
    if ((saved.codigoLote?.trim() && !item.codigoLote?.trim()) || (saved.fabricacion && !item.fabricacion)) {
      throw new Error('El lote ' + item.lote + ' ya tiene código o fecha de fabricación registrados. Vaciar estos campos no elimina los datos del lote. Corrige sus metadatos desde el apartado de lotes; tus cambios se conservan.');
    }
    if ((saved.vencimiento || null) !== (item.vencimiento || null) || (saved.fabricacion || null) !== (item.fabricacion || null) || (saved.codigoLote?.trim() || null) !== (item.codigoLote?.trim() || null)) {
      return undefined;
    }
    return { id_lote: saved.apiLoteId! };
  });
  const newItems = r.items.filter((_, index) => !plan[index]);
  const lotInputs = receiptLotInputs({ ...r, items: newItems }, db, complete && newItems.length > 0);
  const resolutionSignature = JSON.stringify({ signature, plan, lotInputs });
  if (state.resolvedSignature !== resolutionSignature) {
    const lots = lotInputs.length ? await apiData<ApiRow[]>('/lotes/resolver', 'POST', { lotes: lotInputs }) : [];
    if (Array.isArray(lots) && lots.some(lot => lot.estado === false)) throw new Error('El resolver devolvió un lote inactivo. No se guardó la recepción.');
    if (!Array.isArray(lots) || lots.length !== lotInputs.length || lots.some((lot, index) =>
      !Number.isSafeInteger(lot.id_lote) || lot.id_lote < 1 || (lot.id_medicamento != null && lot.id_medicamento !== lotInputs[index].id_medicamento) ||
      (lot.numero_lote != null && lot.numero_lote.trim().toLocaleUpperCase('es') !== lotInputs[index].numero_lote.toLocaleUpperCase('es'))))
      throw new Error('La respuesta del resolver no corresponde a los lotes enviados. No se guardó el borrador.');
    let resolvedIndex = 0;
    state.lots = plan.map(existing => existing || lots[resolvedIndex++]); state.resolvedSignature = resolutionSignature;
  }
  const payload = { ...base, detalles: state.lots!.map((lot, index) => ({ id_lote: lot.id_lote, cantidad: decimal(r.items[index].cantidad) })) };
  // Reconcile a previously lost creation before attempting another POST.
  if (current && !state.id) {
    if (!samePayload(current, payload)) throw conflict(current);
    remember(current); state.savedSignature = signature;
    if (current.estado === 'COMPLETADA') return;
  }
  if (current?.estado === 'COMPLETADA') {
    if (samePayload(current, payload)) return;
    throw conflict(current);
  }
  if (state.savedSignature !== signature) {
    try {
      state.creationAttempted = !state.id || state.creationAttempted;
      const saved = state.id
        ? await apiData<ApiRow>(`/recepciones/${state.id}`, 'PATCH', { ...payload, version: state.version ?? current?.version })
        : await apiData<ApiRow>('/recepciones/borradores', 'POST', payload);
      remember(saved); state.savedSignature = signature;
    } catch (reason) {
      if (!uncertain(reason)) throw reason;
      const actual = state.id ? await readCurrent() : await findCreated();
      if (!actual) throw reason;
      if (!samePayload(actual, payload)) {
        if (state.id && actual.version === state.version) throw reason;
        throw conflict(actual);
      }
      remember(actual); state.savedSignature = signature;
      if (actual.estado === 'COMPLETADA') return;
      if (actual.estado !== 'BORRADOR') throw conflict(actual);
    }
  }
  if (r.evidencia?.contenido.startsWith('data:')) {
    const attachment = `${r.evidencia.nombre}:${r.evidencia.contenido}`;
    if (state.attachmentUncertain) throw new ReceiptConflictError('No se pudo verificar la carga del adjunto. Revisa los documentos del borrador antes de reenviarlo.', mapReceipt(await readCurrent()));
    if (state.attachment !== attachment) {
      try { await upload(`/recepciones/${state.id}/adjuntos`, r.evidencia.contenido, r.evidencia.nombre); state.attachment = attachment; }
      catch (reason) { if (uncertain(reason)) state.attachmentUncertain = true; throw reason; }
    }
  }
  if (command.type === 'receipt.create') {
    try { await apiData(`/recepciones/${state.id}/confirmar`, 'POST', { version: state.version }); }
    catch (reason) {
      if (!uncertain(reason)) throw reason;
      const actual = await readCurrent();
      if (!samePayload(actual, payload)) throw conflict(actual);
      remember(actual);
      if (actual.estado !== 'COMPLETADA') throw reason;
    }
  }
}
