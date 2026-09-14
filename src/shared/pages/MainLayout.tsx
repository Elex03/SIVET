import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../shared/components/Layout/SideBar";
          
const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-[#f0f4f8] overflow-hidden">
      <Sidebar />

      <main className="flex-1 relative flex flex-col min-w-0">
        {/* El contenedor con scroll */}
        <div className="flex-1 overflow-y-auto p-8 relative z-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;