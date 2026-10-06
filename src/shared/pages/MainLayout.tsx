import React, { useState } from "react";
import { Menu, X } from 'lucide-react';
import { Outlet } from "react-router-dom";
import Sidebar from "../../shared/components/Layout/SideBar";
import NotificationInbox from '../components/Layout/NotificationInbox';
          
const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-dvh w-full bg-[#f0f4f8] overflow-hidden">
      {mobileOpen && <button aria-label="Cerrar menú" className="fixed inset-0 bg-slate-900/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}
      <div className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-50 block' : 'hidden'} md:block md:relative shrink-0`} onClick={e => { if ((e.target as HTMLElement).closest('a')) setMobileOpen(false); }}><Sidebar /></div>

      <main className="flex-1 relative flex flex-col min-w-0 min-h-0">
        <NotificationInbox />
        <div className="md:hidden shrink-0 bg-white border-b border-slate-100 p-3 flex items-center gap-3"><button aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-[#304a6d]">{mobileOpen ? <X /> : <Menu />}</button><span className="font-bold text-[#304a6d]">{localStorage.getItem('sivet-institution') || 'SIVET'}</span></div>
        <div className="screen-host flex-1 min-h-0 overflow-hidden p-3 sm:p-5 lg:p-6 relative z-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
