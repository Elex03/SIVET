import React, { useState } from "react";
import UNALogo from "../../assets/images/UNA.png";
import Logo49 from "../../assets/images/FSLN.png";

interface PageHeaderProps {
  header: string;
  sub?: string; university?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ header, sub, university }) => {
  const [cardsHidden, setCardsHidden] = useState(true);

  return (
    <div className="page-heading mt-2 mb-4 sm:mb-8 flex justify-between items-start w-full gap-3">

      {/* ================= TEXTOS ================= */}
      <div className="min-w-0 flex flex-col text-left">
        <div className="page-title-row flex items-center gap-3 min-w-0">
        <h1
          className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight m-0"
          style={{ color: "#304a6d" }}
        >
          {header}
        </h1>
        <button type="button" className="table-focus-toggle summary-orb" data-summary-hidden={cardsHidden} aria-expanded={!cardsHidden} aria-label={cardsHidden ? 'Mostrar resumen' : 'Ocultar resumen'} title={cardsHidden ? 'Mostrar resumen' : 'Ocultar resumen'} onClick={() => setCardsHidden(value => !value)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" /><path d="M7 15v-3m5 3V8m5 7v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="summary-tooltip" aria-hidden="true">{cardsHidden ? 'Mostrar resumen' : 'Ocultar resumen'}</span>
        </button>
        </div>

        {sub ? (
          <p className="text-1xl text-slate-500 mt-1.5 m-0 font-normal">
            {sub}
          </p>
        ) : null}
      </div>

      <div className="flex-shrink-0 flex items-center gap-3">

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
