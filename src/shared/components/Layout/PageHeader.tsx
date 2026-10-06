import React from "react";
import UNALogo from "../../assets/images/UNA.png";
import Logo49 from "../../assets/images/FSLN.png";

interface PageHeaderProps {
  header: string;
  sub?: string; university?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ header, sub, university }) => {
  return (
    <div className="mt-2 mb-4 sm:mb-8 flex justify-between items-start w-full gap-3">

      {/* ================= TEXTOS ================= */}
      <div className="flex flex-col text-left">
        <h1
          className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight m-0"
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

      <div className="flex-shrink-0 pointer-events-none">
        <img
          src={university ? UNALogo : Logo49}
          alt={university ? "Universidad Nacional Agraria" : "Logo Evento"}
          className="h-10 sm:h-16 w-auto max-w-24 sm:max-w-none object-contain"
        />
      </div>

    </div>
  );
};

export default PageHeader;
