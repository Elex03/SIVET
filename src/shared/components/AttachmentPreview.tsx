import { useEffect, useState } from 'react';
export default function AttachmentPreview({ name, content }: { name: string; content: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  const valid = /^data:(application\/pdf|image\/(png|jpeg|webp));base64,/.test(content);
  const pdf = content.startsWith('data:application/pdf;');
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
  if (!valid) return <p role="alert">El adjunto no tiene un formato de vista previa permitido.</p>;
  if (error) return <p role="alert">No se pudo abrir el documento. El archivo adjunto está dañado.</p>;
  return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500 break-all">{name}</p></div>{url ? pdf ? <object data={url} type="application/pdf" aria-label={`Factura ${name}`} className="w-full h-[60dvh] min-h-64 rounded-xl border border-slate-200"><p>Tu navegador no permite visualizar este PDF integrado.</p></object> : <div className="max-h-[60dvh] overflow-auto bg-slate-50 rounded-xl p-3"><img src={url} alt={`Factura adjunta: ${name}`} className="max-w-full h-auto mx-auto" /></div> : <p role="status">Preparando vista previa…</p>}</div>;
}
