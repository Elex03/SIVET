import { useEffect, useState } from 'react';
import useProtectedAsset from './useProtectedAsset';
export default function AttachmentPreview({ name, content, compact = false }: { name: string; content: string; compact?: boolean }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  const valid = /^data:(application\/pdf|image\/(png|jpeg|webp));base64,/.test(content);
  const asset = useProtectedAsset(content.startsWith('api:') ? content : undefined);
  const pdf = content.startsWith('data:application/pdf;') || asset.mime === 'application/pdf';
  useEffect(() => {
    let active = true; let objectUrl = '';
    if (valid) void Promise.resolve().then(() => {
      const [header, encoded] = content.split(',');
      const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
      objectUrl = URL.createObjectURL(new Blob([bytes], { type: header.slice(5).split(';')[0] }));
      if (active) setUrl(objectUrl); else URL.revokeObjectURL(objectUrl);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [content, valid]);
  if (content.startsWith('api:')) {
    if (asset.error) return <p role="alert">No se pudo cargar el adjunto autorizado.</p>;
    return asset.url ? <div className={compact ? "h-60 min-w-0 overflow-hidden flex flex-col gap-2" : "space-y-3"}><p className="text-sm text-slate-500 truncate" title={name}>{name}</p>{pdf ? <object data={asset.url} type="application/pdf" aria-label={name} className={compact ? "w-full flex-1 min-h-0 rounded-xl" : "w-full h-[60dvh] min-h-64"} /> : <img src={asset.url} alt={name} className={compact ? "w-full flex-1 min-h-0 object-contain" : "max-w-full h-auto"} />}</div> : <p role="status">Cargando documento…</p>;
  }
  if (!valid) return <p role="alert">El adjunto no tiene un formato de vista previa permitido.</p>;
  if (error) return <p role="alert">No se pudo abrir el documento. El archivo adjunto está dañado.</p>;
  return <div className={compact ? "h-60 min-w-0 overflow-hidden flex flex-col gap-2" : "space-y-3"}><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500 truncate" title={name}>{name}</p></div>{url ? pdf ? <object data={url} type="application/pdf" aria-label={`Factura ${name}`} className={compact ? "w-full flex-1 min-h-0 rounded-xl border border-slate-200" : "w-full h-[60dvh] min-h-64 rounded-xl border border-slate-200"}><p>Tu navegador no permite visualizar este PDF integrado.</p></object> : <div className={compact ? "flex-1 min-h-0 overflow-hidden bg-slate-50 rounded-xl p-3" : "max-h-[60dvh] overflow-auto bg-slate-50 rounded-xl p-3"}><img src={url} alt={`Factura adjunta: ${name}`} className={compact ? "w-full h-full object-contain" : "max-w-full h-auto mx-auto"} /></div> : <p role="status">Preparando vista previa…</p>}</div>;
}
