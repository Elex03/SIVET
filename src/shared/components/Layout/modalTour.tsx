import type { StepType } from '@reactour/tour';

export function visibleTourElement(element: Element) {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
}

/** Read controls, never their values; no submission or input changes during a tour. */
export function modalTourSteps(dialog: HTMLElement, purpose?: string): StepType[] {
  const title = dialog.querySelector('h2')?.textContent || 'Formulario';
  const steps: StepType[] = [{ selector: dialog.querySelector('.modal-heading') || dialog, content: <><strong>{title}</strong><p className="mt-3">La ventana ya está abierta. Vamos a revisar sus campos. La guía no modifica datos ni pulsa los botones de guardar o confirmar.</p></> }];
  const section = purpose ? dialog.querySelector(`[data-tour-area="${purpose}"]`) || dialog : dialog;
  if (purpose === 'resolve-difference') steps.push({ selector:section, content:'Compara la diferencia reportada por Farmacia con el envío. Bodega registra aquí la revisión o corrección física realizada; Farmacia confirma después lo que realmente recibió.' });
  if (purpose === 'verify-delivery') steps.push({ selector:section, content:'Cuenta lo recibido y registra cantidades, lote y vencimiento. Si algo no coincide, describe la diferencia e informa a Bodega; no confirmes conformidad todavía.' });
  const controls = [...section.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input:not([type="hidden"]), select, textarea')].filter(visibleTourElement);
  for (const control of controls) {
    const label = control.getAttribute('aria-label') || (control.labels?.[0] ? [...control.labels[0].childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join(' ').trim() : '') || control.getAttribute('placeholder') || 'Campo del formulario';
    let instruction = control.tagName === 'SELECT' ? 'Selecciona una de las opciones disponibles.' : control.tagName === 'TEXTAREA' ? 'Añade las observaciones o la información solicitada.' : 'Completa este dato antes de revisar el formulario.';
    if (control instanceof HTMLInputElement) {
      if (control.type === 'password') instruction = 'Introduce una contraseña de al menos ocho caracteres. La guía no introduce ni muestra contraseñas.';
      if (control.type === 'checkbox') instruction = 'Esta casilla habilita o deshabilita la opción indicada. La guía conserva su estado actual.';
      if (control.type === 'number') instruction = 'Introduce una cantidad válida y revisa la unidad y los límites indicados.';
      if (control.type === 'file') instruction = 'Selecciona el documento o imagen y revisa la vista previa antes de guardar.';
    }
    steps.push({ selector: control, content: <><strong>{label}</strong><p className="mt-3">{instruction}</p></> });
  }
  for (const section of [...dialog.querySelectorAll('[data-tour-explain]')].filter(visibleTourElement)) {
    steps.push({ selector: section, content: section.getAttribute('data-tour-explain') || '' });
  }
  if (!controls.length) steps.push({ selector: dialog.querySelector('.modal-body') || dialog, content: 'Revisa los datos del registro seleccionado. Las acciones disponibles dependen de su estado y de tus permisos.' });
  const buttons = [...section.querySelectorAll<HTMLButtonElement>('button')].filter(button => visibleTourElement(button) && /guardar|confirmar|enviar|revisar salida|notificar|informar/i.test(button.textContent || ''));
  if (purpose === 'verify-delivery') {
    for (const button of buttons) steps.push({selector:button, content: button.textContent?.includes('conforme') ? 'Confirma únicamente cuando todas las líneas coincidan. Esta acción acredita el inventario de Farmacia.' : 'Si detectas diferencias, escribe una observación y utiliza esta acción para informar a Bodega. El envío queda pendiente; no se acredita como conforme.'});
  }
  steps.push({ selector: buttons.at(-1) || dialog, content: 'Aquí termina el recorrido. Cuando trabajes fuera de la guía, comprueba los datos antes de guardar, enviar o confirmar. Ninguna de estas acciones se ejecuta automáticamente.' });
  return steps;
}
