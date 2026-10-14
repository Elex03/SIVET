import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CircleHelp, Play } from 'lucide-react';
import { useTour, type StepType } from '@reactour/tour';
import { useAuth } from '../../context/auth';
import Modal from './Modal';
import { pageGuides } from './pageGuides';
import { buttonClass, inputClass } from '../../styles/formStyles';
import { modalTourSteps } from './modalTour';

function visible(selector: string): Element | undefined {
  return [...document.querySelectorAll(selector)].find(element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
}

export default function ContextHelp() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { setSteps, setCurrentStep, setIsOpen, isOpen } = useTour();
  const [choosing, setChoosing] = useState(false);
  const [topic, setTopic] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const cleanupModal = useRef<() => void>(() => {});
  const guides = pageGuides(pathname, user?.role);
  const selected = guides[topic] || guides[0];
  useEffect(() => { setIsOpen(false); return () => {cleanupModal.current(); setIsOpen(false);}; }, [pathname, setIsOpen]);
  useEffect(() => { if (wasOpen.current && !isOpen) {cleanupModal.current(); trigger.current?.focus();} wasOpen.current = isOpen; }, [isOpen]);

  const start = () => {
    if (!setSteps) return;
    setChoosing(false);
    requestAnimationFrame(() => {
      const steps: StepType[] = [];
      const add = (selector: string, title: string, text: string, required = false) => {
        const target = visible(selector);
        if (!target && !required) return;
        steps.push({ selector: target || '[data-context-help]', position: target ? undefined : 'center', content: <><strong className="block text-base mb-3">{title}</strong><p>{text}</p>{!target && <p className="text-xs text-slate-500 mt-3">Este paso describe el formulario que se abre al realizar la acción indicada. El recorrido no ejecuta operaciones.</p>}</> });
      };
      {
        add('.page-heading',selected.title,'Este recorrido te muestra los controles disponibles y explica el procedimiento paso a paso. Puedes cerrarlo en cualquier momento con Cerrar o Escape.');
        add('.filter-controls, .screen-toolbar input, .report-filters', 'Buscar y filtrar','Utiliza estos controles para limitar los registros antes de elegir una acción.');
        add('.table-focus-toggle','Resumen de la pantalla','Este botón muestra u oculta las tarjetas, conservando la actividad reciente.');
        const operation = selected.title.startsWith('Desactivar') ? 'edit' : /^(Consultar|Resolver|Verificar|Revisar)/.test(selected.title) ? 'detail' : 'create';
        const purpose = selected.title.startsWith('Resolver diferencias') ? 'resolve-difference' : selected.title === 'Verificar una entrega' ? 'verify-delivery' : selected.title === 'Revisar y aprobar una solicitud' ? 'approve-request' : undefined;
        const openerSelector = purpose ? `[data-tour-purpose="${purpose}"]:not(:disabled)` : `[data-tour-open="${operation}"]:not(:disabled)`;
        const opener = visible(openerSelector) as HTMLButtonElement | undefined;
        if (purpose && !opener) {
          add('.screen-toolbar', selected.title, purpose === 'resolve-difference' ? 'No hay una solicitud con diferencias pendientes visible en esta tabla. Revisa los filtros y las otras páginas. Bodega solo puede responder cuando Farmacia haya reportado una diferencia.' : purpose === 'verify-delivery' ? 'La verificación solo está disponible para solicitudes en estado Enviado. Revisa los filtros y las otras páginas; una solicitud completada no permite repetir la recepción.' : 'La aprobación requiere una solicitud Pendiente. Revisa los filtros y las otras páginas antes de iniciar este recorrido.', true);
          setSteps(steps); setCurrentStep(steps.length - 1); setIsOpen(true); return;
        }
        if (opener && pathname !== '/dashboard' && pathname !== '/reportes') {
          let attempted = false;
          add(openerSelector, selected.title, 'Al pulsar Siguiente abriremos esta ventana y continuaremos la guía dentro de ella. No se guardará ningún cambio.');
          steps.push({ selector: opener, content: 'Abriendo la ventana…', action: () => {
            if (attempted) return;
            attempted = true;
            const existing = new Set(document.querySelectorAll('.modal-panel'));
            let owned: HTMLElement | undefined;
            let cancelled = false;

            const observer = new MutationObserver(() => {
              if (cancelled) return;
              const dialog = [...document.querySelectorAll<HTMLElement>('.modal-panel')].find(element => !existing.has(element));
              if (!dialog) return;
              owned = dialog;
              observer.disconnect(); clearTimeout(timer);
              setSteps(modalTourSteps(dialog, purpose)); setCurrentStep(0);
            });
            cleanupModal.current = () => { cancelled = true; observer.disconnect(); clearTimeout(timer); owned?.querySelector<HTMLButtonElement>('[data-tour-close]')?.click(); owned = undefined; };
            observer.observe(document.body, {childList:true,subtree:true});
            const timer = setTimeout(() => {
              observer.disconnect();
              if (cancelled) return;
              setSteps([{selector:opener,content:'No se pudo abrir la ventana. Cierra el recorrido, revisa si la pantalla sigue cargando e inténtalo nuevamente.'}]); setCurrentStep(0);
            }, 4000);
            opener.click();
          } });
          setSteps(steps); setCurrentStep(0); setIsOpen(true); return;
        }
        const table = '.data-table';
        const action = '.toolbar-actions, .screen-toolbar button';
        let targets = [action, '[role="dialog"] form', '[role="dialog"] form', '[role="dialog"] form', table];
        if (/^(Consultar|Resolver|Verificar|Revisar|Desactivar)/.test(selected.title)) targets = [table,table,table,table];
        if (pathname.includes('preparacion')) targets = ['.preparation-list','.medication-tip','.preparation-detail','.preparation-detail','.preparation-detail'];
        if (pathname === '/reportes') targets = ['.report-filters','.report-preview','.report-preview','.report-preview','.report-preview'];
        if (pathname === '/dashboard') targets = ['.screen-toolbar','.stat-card','.screen-body','.screen-body'];
        if (pathname === '/configuracion') targets = ['.screen-body select','.screen-body input[type="checkbox"]','.screen-body form'];
        if (pathname.includes('notificaciones')) targets = ['.screen-toolbar','.screen-body','.screen-body'];
        if (selected.title === 'Consultar inventario') targets = ['.filter-controls',table,table,'.table-focus-toggle'];
        selected.steps.forEach((text,index) => add(targets[index] || table,selected.title,text,true));
        add('.activity-panel','Actividad reciente','Aquí puedes consultar las operaciones recientes relacionadas con este módulo.');
      }
      setSteps(steps); setCurrentStep(0); setIsOpen(true);
    });
  };
  return <>
    <button ref={trigger} data-context-help type="button" title="Ayuda de esta pantalla" aria-label="Ayuda de esta pantalla" onClick={() => {setTopic(0);setChoosing(true);}} className="bg-white border border-slate-200 rounded-xl p-3 text-[#304a6d]"><CircleHelp size={20} /></button>
    <Modal isOpen={choosing} onClose={() => setChoosing(false)} title="Recorrido guiado" subtitle="Selecciona qué quieres aprender en esta pantalla" maxWidth="max-w-xl"><div className="flex flex-col gap-5"><label className="text-sm font-semibold">¿Qué quieres hacer?<select className={`${inputClass} mt-2`} value={topic} onChange={event => setTopic(Number(event.target.value))}>{guides.map((guide,index) => <option key={guide.title} value={index}>{guide.title}</option>)}</select></label><p className="text-sm text-slate-500">La guía abre las ventanas disponibles y explica sus campos. Al finalizar cierra la ventana que abrió, sin guardar ni confirmar operaciones.</p><button type="button" className={`${buttonClass} flex items-center justify-center gap-2`} onClick={start}><Play size={16} />Iniciar recorrido</button></div></Modal>
  </>;
}
