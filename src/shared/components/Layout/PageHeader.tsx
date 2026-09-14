import React from "react";
import Logo49 from "../../assets/images/FSLN.png"; 

interface PageHeaderProps {
  header: string;
  sub?: string; 
}

const PageHeader: React.FC<PageHeaderProps> = ({ header, sub }) => {
  return (
    <div className="mt-2 mb-8 flex justify-between items-start w-full">
      
      {/* ================= TEXTOS ================= */}
      <div className="flex flex-col text-left">
        <h1 
          className="text-4xl font-semibold leading-none tracking-tight m-0"
          style={{ color: "#304a6d" }}
        >
          {header}
        </h1>
        
        {sub ? (
          <p className="text-1xl text-slate-500 mt-1.5 m-0 font-normal">
            {sub}
          </p>
        ) : null}
      </div>

      <div className="flex-shrink-0 ml-4 pointer-events-none">
        <img 
          src={Logo49} 
          alt="Logo Evento" 
          className="h-16 w-auto object-contain" 
        />
      </div>
      
    </div>
  );
};

export default PageHeader;