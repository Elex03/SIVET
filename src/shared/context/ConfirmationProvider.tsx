import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import Modal from '../components/Layout/Modal';
import { ConfirmationContext } from './confirmation';
import type { Confirmation } from './confirmation';
import { buttonClass } from '../styles/formStyles';

export default function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<Confirmation | null>(null);
  const resolver = useRef<((result: boolean) => void) | null>(null);
  const confirm = useCallback((request: Confirmation) => {
    // Ignore repeated actions while an existing confirmation is awaiting a decision.
    if (resolver.current) return Promise.resolve(false);
    setOptions(request);
    return new Promise<boolean>(resolve => { resolver.current = resolve; });
  }, []);
  const finish = (result: boolean) => { const resolve = resolver.current; resolver.current = null; setOptions(null); resolve?.(result); };
  useEffect(() => () => { resolver.current?.(false); resolver.current = null; }, []);
  return <ConfirmationContext.Provider value={confirm}>{children}
    <Modal isOpen={!!options} onClose={() => finish(false)} title={options?.title || 'Confirmar acción'} maxWidth="max-w-lg">
      {options && <div className="flex flex-col gap-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${options.danger ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-[#304a6d]'}`}>{options.danger ? <AlertTriangle /> : <ShieldCheck />}</div>
        <p className="text-sm text-slate-600 leading-relaxed">{options.description}</p>
        {!!options.details?.length && <ul className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-700 space-y-2">{options.details.map((detail, index) => <li className="break-words" key={index}>{detail}</li>)}</ul>}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3"><button autoFocus className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50" onClick={() => finish(false)}>Volver</button><button className={options.danger ? 'rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-sm font-bold text-white' : buttonClass} onClick={() => finish(true)}>{options.confirmLabel || 'Confirmar'}</button></div>
      </div>}
    </Modal>
  </ConfirmationContext.Provider>;
}
