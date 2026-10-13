import PageSkeleton from './PageSkeleton';
export default function DataFeedback({ error, loading, refresh }: { error: string; loading: boolean; local: boolean; refresh: () => Promise<void> }) {
  return <>{loading && !error && <PageSkeleton />}{error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error} <button className="underline font-bold" onClick={() => void refresh()}>Reintentar</button></div>}</>;
}
