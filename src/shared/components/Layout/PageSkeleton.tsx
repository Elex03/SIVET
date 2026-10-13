export default function PageSkeleton({
  heading = false,
}: {
  heading?: boolean;
}) {
  return (
    <div
      className="page-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Cargando contenido, espera un momento…</span>
      <div aria-hidden="true" className="skeleton-content">
        {heading && (
          <div className="space-y-3">
            <div className="skeleton-block h-8 w-64 max-w-full" />
            <div className="skeleton-block h-4 w-96 max-w-full" />
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card">
              <div className="flex justify-between gap-4">
                <div className="skeleton-block h-4 w-2/3" />
                <div className="skeleton-block h-9 w-9 shrink-0" />
              </div>
              <div className="skeleton-block h-7 w-16 mt-3" />
              <div className="skeleton-block h-3 w-3/4 mt-4" />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="skeleton-block h-11 flex-1 min-w-40" />
          <div className="skeleton-block h-11 w-36" />
        </div>
        <div className="skeleton-table">
          <div className="skeleton-block h-10 w-full mb-5" />
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="grid grid-cols-3 sm:grid-cols-5 gap-5 py-4 border-b border-slate-100"
            >
              {[0, 1, 2, 3, 4].map((c) => (
                <div
                  key={c}
                  className={`skeleton-block h-4 ${c > 2 ? "hidden sm:block" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
