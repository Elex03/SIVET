import ContextHelp from '../../../shared/components/Layout/ContextHelp';
import { Link } from 'react-router-dom';
import { LogOut, Store } from 'lucide-react';
import { useAuth } from '../../../shared/context/auth';
import { useTheme } from '../../../shared/context/preferences';
import Preparacion from './Preparacion';

export default function PreparationPortal() {
  const { user, logout } = useAuth();
  useTheme();
  return <div className="h-dvh overflow-hidden bg-[#f0f4f8] flex flex-col">
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex justify-between gap-3 items-center shrink-0"><div className="flex gap-3 items-center min-w-0"><span className="bg-blue-50 text-blue-600 rounded-xl p-2"><Store size={20} /></span><div className="min-w-0"><p className="font-bold text-[#304a6d] text-sm">SIVET · Bodega operativa</p><p className="text-xs text-slate-500 truncate">{user?.username} · Preparación de pedidos</p></div></div><div className="flex gap-3 items-center"><ContextHelp />{user?.role !== 'preparador' && <Link to="/bodega/preparacion" className="text-xs font-semibold text-blue-600">Volver a Bodega</Link>}<button onClick={logout} className="flex gap-2 items-center text-rose-600 text-xs font-semibold p-2 rounded-lg bg-rose-50"><LogOut size={16} />Salir</button></div></header>
    <main className="screen-host flex-1 min-h-0 p-3 sm:p-5 lg:p-6"><Preparacion operational /></main>
  </div>;
}
