import axios from 'axios';
export function apiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : 'No se pudo completar la operación. Inténtalo nuevamente.';
  if (axios.isCancel(error)) return 'La espera fue cancelada. Los datos del formulario se conservan.';
  const status = error.response?.status;
  const path = String(error.config?.url || '').split('?')[0];
  const resource = path.includes('/recepciones') ? 'la recepción' : path.includes('/lotes') ? 'los lotes' : path.includes('/notificaciones') ? 'las notificaciones' : path.includes('/auth') ? 'la sesión' : 'los datos';
  const write = !['get','head'].includes((error.config?.method || 'get').toLowerCase());
  const operation = write ? `No se pudo confirmar la operación sobre ${resource}.` : `No se pudo cargar ${resource}.`;
  const data = error.response?.data;
  const detail = typeof data?.error?.message === 'string' ? data.error.message : typeof data?.message === 'string' ? data.message : '';
  const guidance = !status ? (write ? 'Se perdió la conexión o el servidor tardó demasiado. Comprueba el estado del registro antes de volver a guardar para evitar duplicados.' : 'El servidor no respondió a tiempo. Puede estar iniciándose; espera un momento y vuelve a intentar. Revisa también tu conexión.')
    : status === 401 ? 'La sesión no pudo validarse. Vuelve a iniciar sesión.'
    : status === 403 ? 'Tu cuenta no tiene permiso para esta operación.'
    : status === 404 ? 'El registro o servicio solicitado ya no está disponible. Actualiza los datos.'
    : data?.error?.code === 'LOT_EXPIRED' ? 'Revisa las fechas y el tipo de ingreso. Las compras no admiten lotes vencidos. Tus cambios se conservan.'
    : status === 409 ? 'Los datos entraron en conflicto. Actualiza el registro y revisa los cambios antes de guardar.'
    : status === 413 ? 'El archivo supera el tamaño permitido. Selecciona uno más pequeño.'
    : status === 429 ? 'El servidor limitó las solicitudes. Espera el tiempo indicado antes de continuar.'
    : status >= 500 ? 'El servidor tuvo un problema. Si estabas guardando, comprueba el registro antes de repetir la operación.'
    : 'Revisa los datos indicados y vuelve a intentar.';
  const lot = data?.error?.code === 'LOT_CONFLICT' ? 'Conflicto en los datos del lote: revisa vencimiento, fabricación y código. Los metadatos existentes no se modificaron.' : '';
  const requestId = error.response?.headers?.['x-request-id'];
  return [operation, lot, detail, guidance, requestId ? `Referencia de soporte: ${String(requestId).slice(0,120)}.` : ''].filter(Boolean).join(' ');
}
