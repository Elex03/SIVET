import type { ReactNode } from 'react';
import { TourProvider } from '@reactour/tour';
import { buttonClass } from '../styles/formStyles';

export default function GuidedTourProvider({ children }: { children: ReactNode }) {
  return <TourProvider steps={[]} disableInteraction scrollSmooth={false} showDots={false}
    accessibilityOptions={{ closeButtonAriaLabel: 'Cerrar recorrido', showNavigationScreenReaders: false }}
    className="sivet-tour" padding={8}
    styles={{ popover: base => ({...base, borderRadius:14, padding:22, background:'var(--ui-panel)', color:'var(--ui-text)', maxWidth:'min(370px, calc(100vw - 24px))', maxHeight:'calc(100dvh - 32px)', overflowY:'auto', zIndex:21001, boxShadow:'0 12px 48px #162c4433'}), maskWrapper: base => ({...base,zIndex:21000}) }}
    ContentComponent={({ steps, currentStep, setCurrentStep, setIsOpen, ...props }) => {
      const content = steps[currentStep]?.content;
      return <div className="flex flex-col gap-4"><div className="flex justify-between items-center gap-3"><span className="text-xs text-slate-500">Paso {currentStep + 1} de {steps.length}</span><button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar recorrido" className="p-2 text-sm">Cerrar</button></div><div aria-live="polite" className="text-sm leading-relaxed">{typeof content === 'function' ? content({...props,steps,currentStep,setCurrentStep,setIsOpen}) as ReactNode : content}</div><div className="flex justify-between items-center gap-3"><button type="button" disabled={currentStep === 0} className="text-sm p-2 disabled:opacity-40" onClick={() => setCurrentStep(step => step - 1)}>Anterior</button><button type="button" className={buttonClass} onClick={() => currentStep === steps.length - 1 ? setIsOpen(false) : setCurrentStep(step => step + 1)}>{currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}</button></div></div>;
    }}
  >{children}</TourProvider>;
}
