export type Destination = 'HOSPITAL' | 'CASA';
export const destinations = { HOSPITAL: 'Administrar en el hospital', CASA: 'Para llevar a casa' };
export type RequestStatus = 'PENDIENTE' | 'EN PREPARACION' | 'LISTO PARA ENTREGA' | 'ENVIADO' | 'COMPLETADO' | 'RECHAZADO' | 'DESPACHADO' | 'DEVUELTO';
export interface CatalogRecord {
  id: string; tipo: string; nombre: string; codigo: string; descripcion: string;
  activo: boolean; categoria: string; accion: string; marca: string; unidad: string; minimo: number;
  correos: string[]; telefonos: string[];
  presentacion?: string; uxe?: number; imagen?: string;
}
export interface Stock {
  id: string; productoId: string; lote: string; vencimiento: string; cantidad: number;
  ubicacion: 'Bodega Central' | 'Farmacia' | 'En tránsito' | 'En revisión';
}
export interface RequestItem { stockId: string; cantidad: number }
export interface ReceiptCheck { stockId: string; cantidad: number; lote: string; vencimiento: string; conforme: boolean }
export interface SupplyRequest {
  id: string; fecha: string; solicitante: string; area: string; destino?: Destination;
  prioridad: string; estado: RequestStatus; nota: string; observacion: string;
  items: RequestItem[]; entregado?: string; despachado?: string;
  recibido?: string; receptor?: string; comprobacion?: ReceiptCheck[];
  incidencia?: { fecha: string; receptor: string; nota: string; checks: ReceiptCheck[]; revision?: string; resuelta: boolean };
}
export interface Movement {
  id: string; fecha: string; productoId: string; lote: string; cantidad: number;
  tipo: 'ENTRADA' | 'TRASLADO' | 'SALIDA'; area: string; destino?: Destination; documento: string;
}
export interface Receipt {
  id: string; proveedorId: string; fecha: string; responsable: string;
  documento?: string; evidencia?: { nombre: string; contenido: string }; estado?: 'BORRADOR' | 'COMPLETADO' | 'CANCELADO';
  items: { productoId: string; lote: string; vencimiento: string; cantidad: number }[];
}
export interface Database {
  catalogos: CatalogRecord[]; existencias: Stock[]; solicitudes: SupplyRequest[];
  movimientos: Movement[]; recepciones: Receipt[]; notificaciones: Notification[];
  actividad?: Activity[];
}
export interface Activity { id: string; fecha: string; usuario: string; localidad: string; accion: string; documento: string; detalle: string }
export interface Notification { id: string; fecha: string; rol: 'farmacia' | 'bodega'; solicitudId: string; titulo: string; mensaje: string; leidaPor: string[] }
export type Command = (
  | { type: 'catalog.save'; record: CatalogRecord }
  | { type: 'request.create'; request: SupplyRequest }
  | { type: 'request.status'; id: string; estado: RequestStatus; observacion: string }
  | { type: 'request.receive'; id: string; checks: ReceiptCheck[]; note: string; receiver: string; mode: 'confirm' | 'report' | 'return' }
  | { type: 'request.review'; id: string; note: string }
  | { type: 'notification.read'; id: string; user: string }
  | { type: 'receipt.create'; receipt: Receipt }
  | { type: 'receipt.draft'; receipt: Receipt }
  | { type: 'receipt.cancel'; id: string }
  | { type: 'pharmacy.dispatch'; id: string; area: string; destino: Destination; nota: string; items: RequestItem[] }
  ) & { actor?: string; localidad?: string };
export const emptyDatabase: Database = { catalogos: [], existencias: [], solicitudes: [], movimientos: [], recepciones: [], notificaciones: [] };
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Managua' });
export const newId = () => crypto.randomUUID();

export function availableStock(db: Database, stockId: string, excludeRequest = '') {
  const reserved = db.solicitudes.filter(r => r.id !== excludeRequest && ['EN PREPARACION', 'LISTO PARA ENTREGA'].includes(r.estado)).reduce((total, r) => total + r.items.filter(i => i.stockId === stockId).reduce((n, i) => n + i.cantidad, 0), 0);
  return Math.max(0, (db.existencias.find(s => s.id === stockId)?.cantidad || 0) - reserved);
}

/** Pure transaction: validation completes before the caller persists the returned state. */
export function applyCommand(source: Database, command: Command): Database {
  const db = structuredClone(source);
  db.notificaciones ??= [];
  db.actividad ??= [];
  const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
  const notify = (rol: Notification['rol'], request: SupplyRequest, titulo: string, mensaje: string) => db.notificaciones.push({ id: newId(), fecha: new Date().toISOString(), rol, solicitudId: request.id, titulo, mensaje, leidaPor: [] });
  if (command.type === 'catalog.save') {
    const r = command.record;
    assert(r.nombre.trim(), 'Escribe un nombre.');
    assert(!db.catalogos.some(c => c.id !== r.id && c.tipo === r.tipo && (c.nombre.toLowerCase() === r.nombre.toLowerCase() || (r.codigo && c.codigo === r.codigo))), 'Ya existe un registro con ese nombre o código.');
    assert(r.correos.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)), 'Revisa los correos electrónicos.');
    assert(r.telefonos.every(phone => /^[+\d\s().-]{7,25}$/.test(phone)), 'Revisa los números telefónicos.');
    assert(Number.isFinite(r.minimo) && r.minimo >= 0, 'El mínimo debe ser un número positivo o cero.');
    if (r.tipo === 'medicamentos') {
      assert(r.codigo.trim() && r.unidad.trim(), 'Código de barras y unidad son obligatorios.');
      assert(r.uxe === undefined || (Number.isInteger(r.uxe) && r.uxe > 0), 'La cantidad por empaque debe ser un entero positivo.');
      assert(!r.imagen || (/^data:image\/(png|jpeg|webp);base64,/.test(r.imagen) && r.imagen.length <= 2100000), 'Imagen inválida o demasiado grande.');
    }
    db.catalogos = [...db.catalogos.filter(c => c.id !== r.id), r];
  }
  if (command.type === 'request.create') {
    const r = command.request;
    assert(!db.solicitudes.some(s => s.id === r.id), 'Esta solicitud ya fue registrada.');
    assert(r.solicitante.trim(), 'Indica el solicitante.');
    assert(r.items.length && new Set(r.items.map(i => i.stockId)).size === r.items.length, 'Añade productos sin repetir lotes.');
    for (const item of r.items) {
      const stock = db.existencias.find(s => s.id === item.stockId && s.ubicacion === 'Bodega Central');
      assert(stock && stock.vencimiento > today(), 'El lote no está disponible o está vencido.');
      assert(db.catalogos.some(p => p.id === stock?.productoId && p.activo), 'El producto está inactivo.');
      assert(Number.isInteger(item.cantidad) && item.cantidad > 0 && item.cantidad <= availableStock(db, item.stockId), 'Cantidad inválida o superior al stock disponible sin reservas.');
    }
    db.solicitudes.push({ ...r, area: 'Farmacia', destino: undefined, estado: 'PENDIENTE', fecha: new Date().toISOString() });
    notify('bodega', r, 'Nueva solicitud de Farmacia', `${r.area} solicita ${r.items.length} producto(s).`);
  }
  if (command.type === 'request.status') {
    const r = db.solicitudes.find(s => s.id === command.id);
    assert(r, 'Solicitud no encontrada.');
    const request = r!;
    const next: Partial<Record<RequestStatus, RequestStatus[]>> = {
      PENDIENTE: ['EN PREPARACION', 'RECHAZADO'], 'EN PREPARACION': ['LISTO PARA ENTREGA', 'RECHAZADO'],
      'LISTO PARA ENTREGA': ['ENVIADO', 'RECHAZADO'],
    };
    assert(next[request.estado]?.includes(command.estado), 'La solicitud cambió de estado. Actualiza los datos.');
    if (command.estado === 'RECHAZADO') assert(command.observacion.trim(), 'Indica el motivo del rechazo.');
    if (['EN PREPARACION', 'LISTO PARA ENTREGA', 'ENVIADO'].includes(command.estado)) {
      for (const item of request.items) {
        const stock = db.existencias.find(s => s.id === item.stockId && s.ubicacion === 'Bodega Central');
        assert(stock && stock.vencimiento > today(), 'El lote no está disponible o está vencido. No se aprobó la solicitud.');
        assert(db.catalogos.some(p => p.id === stock?.productoId && p.activo), 'Hay un producto inactivo en la solicitud.');
        assert(availableStock(db, item.stockId, request.id) >= item.cantidad, `Stock insuficiente en ${stock!.lote}. Disponible sin otras reservas: ${availableStock(db, item.stockId, request.id)}.`);
      }
    }
    if (command.estado === 'ENVIADO' || command.estado === 'DESPACHADO') {
      for (const item of request.items) {
        const stock = db.existencias.find(s => s.id === item.stockId);
        assert(stock && stock.vencimiento > today(), 'No se puede entregar un lote vencido.');
        if (command.estado === 'ENVIADO') {
          assert(stock!.cantidad >= item.cantidad, 'Stock insuficiente. No se registró la entrega.');
          stock!.cantidad -= item.cantidad;
          db.existencias.push({ ...stock!, id: `transito-${request.id}-${stock!.id}`, ubicacion: 'En tránsito', cantidad: item.cantidad });
        } else {
          const pharmacy = db.existencias.find(s => s.id === `farmacia-${stock!.id}`);
          assert(pharmacy && pharmacy.cantidad >= item.cantidad, 'Stock insuficiente en Farmacia.');
          pharmacy!.cantidad -= item.cantidad;
        }
        db.movimientos.push({ id: newId(), fecha: new Date().toISOString(), productoId: stock!.productoId, lote: stock!.lote, cantidad: item.cantidad,
          tipo: command.estado === 'ENVIADO' ? 'TRASLADO' : 'SALIDA', area: request.area, destino: request.destino, documento: request.id });
      }
      if (command.estado === 'ENVIADO') request.entregado = new Date().toISOString();
      else request.despachado = new Date().toISOString();
    }
    request.estado = command.estado;
    request.observacion = command.observacion;
    if (command.estado === 'EN PREPARACION') notify('farmacia', request, 'Solicitud aprobada', `Bodega verificó y reservó las existencias de tu solicitud de ${request.area}.`);
    if (command.estado === 'LISTO PARA ENTREGA') notify('farmacia', request, 'Solicitud lista para entrega', 'Bodega terminó de preparar los productos.');
    if (command.estado === 'ENVIADO') notify('farmacia', request, 'Envío pendiente de verificar', 'Revisa producto, lote, vencimiento y cantidad recibida antes de confirmar el ingreso.');
    if (command.estado === 'RECHAZADO') notify('farmacia', request, 'Solicitud rechazada', command.observacion);
  }
  if (command.type === 'request.receive') {
    const request = db.solicitudes.find(r => r.id === command.id);
    assert(request?.estado === 'ENVIADO', 'Solo se puede verificar un envío pendiente de recepción.');
    assert(command.receiver.trim(), 'Indica quién recibe.');
    assert(command.checks.length === request!.items.length && new Set(command.checks.map(c => c.stockId)).size === request!.items.length, 'Revisa todas las líneas del envío una sola vez.');
    for (const check of command.checks) {
      const expected = request!.items.find(i => i.stockId === check.stockId);
      assert(expected && Number.isInteger(check.cantidad) && check.cantidad >= 0, 'Revisa las cantidades recibidas.');
      const transit = db.existencias.find(s => s.id === `transito-${request!.id}-${check.stockId}`);
      assert(transit, 'No se encontró el lote en tránsito.');
      if (command.mode === 'confirm') {
        assert(check.conforme && check.cantidad === expected!.cantidad && check.lote === transit!.lote && check.vencimiento === transit!.vencimiento, 'Hay diferencias. Repórtalas a Bodega antes de confirmar la recepción.');
        assert(transit!.vencimiento > today() && transit!.cantidad >= check.cantidad, 'El lote está vencido o no tiene la cantidad enviada.');
        let pharmacy = db.existencias.find(s => s.id === `farmacia-${check.stockId}`);
        if (!pharmacy) { pharmacy = { ...transit!, id: `farmacia-${check.stockId}`, ubicacion: 'Farmacia', cantidad: 0 }; db.existencias.push(pharmacy); }
        pharmacy.cantidad += check.cantidad; transit!.cantidad -= check.cantidad;
      }
    }
    if (command.mode === 'return') {
      assert(command.note.trim(), 'Indica el motivo de devolución.');
      for (const item of request!.items) {
        const transit = db.existencias.find(s => s.id === `transito-${request!.id}-${item.stockId}`)!;
        assert(transit.cantidad === item.cantidad, 'No se puede devolver un envío parcialmente recibido.');
        transit.ubicacion = 'En revisión';
      }
      request!.estado = 'DEVUELTO';
      request!.incidencia = { fecha: new Date().toISOString(), receptor: command.receiver, nota: command.note, checks: command.checks, resuelta: false };
      notify('bodega', request!, 'Envío devuelto por Farmacia', command.note);
    } else if (command.mode === 'report') {
      assert(command.note.trim(), 'Describe la diferencia encontrada para informar a Bodega.');
      request!.incidencia = { fecha: new Date().toISOString(), receptor: command.receiver, nota: command.note, checks: command.checks, resuelta: false };
      notify('bodega', request!, 'Diferencia reportada por Farmacia', command.note);
    } else {
      request!.estado = 'COMPLETADO'; request!.recibido = new Date().toISOString(); request!.receptor = command.receiver; request!.comprobacion = command.checks;
      if (request!.incidencia) request!.incidencia.resuelta = true;
      notify('bodega', request!, 'Recepción verificada por Farmacia', `${command.receiver} verificó todas las cantidades y lotes recibidos.`);
    }
  }
  if (command.type === 'request.review') {
    const request = db.solicitudes.find(r => r.id === command.id);
    assert(request && ['ENVIADO', 'DEVUELTO'].includes(request.estado) && request.incidencia && !request.incidencia.resuelta, 'No hay una diferencia pendiente de revisión.');
    assert(command.note.trim(), 'Escribe la respuesta de Bodega.');
    request!.incidencia!.revision = command.note;
    notify('farmacia', request!, 'Bodega respondió a la diferencia', command.note);
  }
  if (command.type === 'notification.read') {
    const notification = db.notificaciones.find(n => n.id === command.id);
    assert(notification, 'Notificación no encontrada.');
    if (!notification!.leidaPor.includes(command.user)) notification!.leidaPor.push(command.user);
  }
  if (command.type === 'receipt.create') {
    const receipt = command.receipt;
    assert(!db.recepciones.some(r => r.id === receipt.id && r.estado !== 'BORRADOR'), 'La recepción ya existe.');
    assert(!receipt.documento || !db.recepciones.some(r => r.id !== receipt.id && r.proveedorId === receipt.proveedorId && r.documento === receipt.documento && r.estado !== 'CANCELADO'), 'Esta factura ya está registrada para el proveedor.');
    assert(db.catalogos.some(c => c.id === receipt.proveedorId && c.tipo === 'proveedores' && c.activo), 'Selecciona un proveedor activo.');
    assert(receipt.fecha && receipt.fecha <= today() && receipt.items.length, 'Revisa fecha y productos de la recepción.');
    for (const item of receipt.items) {
      assert(db.catalogos.some(c => c.id === item.productoId && c.tipo === 'medicamentos' && c.activo), 'Producto no disponible en catálogo.');
      assert(item.lote.trim() && item.vencimiento > today() && Number.isInteger(item.cantidad) && item.cantidad > 0, 'Revisa lote, vencimiento y cantidad de cada producto.');
      let stock = db.existencias.find(s => s.productoId === item.productoId && s.lote === item.lote && s.ubicacion === 'Bodega Central');
      if (stock) { assert(stock.vencimiento === item.vencimiento, 'El lote ya tiene otra fecha de vencimiento.'); stock.cantidad += item.cantidad; }
      else { stock = { ...item, id: newId(), ubicacion: 'Bodega Central' }; db.existencias.push(stock); }
      db.movimientos.push({ id: newId(), fecha: `${receipt.fecha}T12:00:00-06:00`, productoId: item.productoId, lote: item.lote, cantidad: item.cantidad, tipo: 'ENTRADA', area: 'Bodega Central', documento: receipt.id });
    }
    db.recepciones = [...db.recepciones.filter(r => r.id !== receipt.id), { ...receipt, estado: 'COMPLETADO' }];
  }
  if (command.type === 'receipt.draft') {
    assert(!db.recepciones.some(r => r.id === command.receipt.id && r.estado !== 'BORRADOR'), 'Solo se pueden editar borradores.');
    db.recepciones = [...db.recepciones.filter(r => r.id !== command.receipt.id), { ...command.receipt, estado: 'BORRADOR' }];
  }
  if (command.type === 'receipt.cancel') {
    const receipt = db.recepciones.find(r => r.id === command.id);
    assert(receipt?.estado === 'BORRADOR', 'Solo se puede cancelar un borrador.');
    receipt!.estado = 'CANCELADO';
  }
  if (command.type === 'pharmacy.dispatch') {
    assert(command.area.trim() && Object.hasOwn(destinations, command.destino), 'Indica localidad y modalidad de entrega.');
    assert(db.catalogos.some(c => c.tipo === 'ubicaciones' && c.activo && c.nombre === command.area.trim()), 'Selecciona una ubicación activa del catálogo de Farmacia.');
    assert(!db.movimientos.some(m => m.documento === command.id), 'Esta salida ya fue registrada.');
    assert(command.items.length && new Set(command.items.map(i => i.stockId)).size === command.items.length, 'Agrega productos sin repetir lotes.');
    for (const item of command.items) {
      const stock = db.existencias.find(s => s.id === item.stockId && s.ubicacion === 'Farmacia');
      assert(stock && stock.vencimiento > today() && db.catalogos.some(p => p.id === stock.productoId && p.activo), 'Producto inactivo, vencido o no disponible en Farmacia.');
      assert(Number.isInteger(item.cantidad) && item.cantidad > 0 && stock!.cantidad >= item.cantidad, 'Cantidad inválida o stock insuficiente en Farmacia.');
      stock!.cantidad -= item.cantidad;
      db.movimientos.push({ id: newId(), fecha: new Date().toISOString(), productoId: stock!.productoId, lote: stock!.lote, cantidad: item.cantidad, tipo: 'SALIDA', area: command.area.trim(), destino: command.destino, documento: command.id });
    }
  }
  if (command.type !== 'notification.read') {
    const documento = 'id' in command ? command.id : 'receipt' in command ? command.receipt.id : 'record' in command ? command.record.id : command.request.id;
    const localidad = command.type.startsWith('receipt.') ? 'Bodega Central' : command.type === 'pharmacy.dispatch' || command.type === 'request.receive' || command.type === 'request.create' ? 'Farmacia' : command.type.startsWith('request.') ? 'Bodega Central' : command.localidad || 'General';
    const detalle = command.type === 'catalog.save' ? command.record.nombre : command.type === 'request.status' ? `${command.estado} · ${command.observacion}` : command.type === 'request.receive' ? `${command.mode === 'confirm' ? 'Recepción conforme' : command.mode === 'return' ? 'Devolución' : 'Recepción pendiente'} · ${command.note}` : command.type === 'pharmacy.dispatch' ? `${command.area} · ${destinations[command.destino]} · ${command.nota}` : command.type === 'request.review' ? command.note : 'receipt' in command ? `${command.receipt.documento || documento} · ${command.receipt.items.length} líneas` : command.type === 'request.create' ? command.request.nota : 'Borrador cancelado';
    db.actividad.push({ id: newId(), fecha: new Date().toISOString(), usuario: command.actor || ('receiver' in command ? command.receiver : 'Sistema'), localidad, accion: command.type, documento, detalle });
  }
  return db;
}
