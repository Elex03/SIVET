import { Outlet } from "react-router-dom";

import Sidebar from "./SideBar";

const MainLayout = () => {
  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">
        <Outlet />
      </main>

    </div>
  );
};

export default MainLayout;