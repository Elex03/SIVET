import { createContext, useContext } from 'react';
export interface Confirmation { title: string; description: string; details?: string[]; confirmLabel?: string; danger?: boolean }
export const ConfirmationContext = createContext<((options: Confirmation) => Promise<boolean>) | null>(null);
export function useConfirmation() {
  const confirm = useContext(ConfirmationContext);
  if (!confirm) throw new Error('Se requiere ConfirmationProvider.');
  return confirm;
}
