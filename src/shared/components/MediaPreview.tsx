import { useState } from 'react';
import { Download, FileText, Image, Minus, Plus, RotateCcw } from 'lucide-react';

/** Shared viewer for loaded, authorized attachments and medication images. */
export default function MediaPreview({ url, name, pdf = false, compact = false }: { url: string; name: string; pdf?: boolean; compact?: boolean }) {
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const Icon = pdf ? FileText : Image;
  return <section className={`media-preview ${compact ? 'media-preview-compact' : ''}`} aria-label={`Vista previa de ${name}`}>
    <header className="media-preview-toolbar">
      <Icon size={20} className="shrink-0 text-[#466e68]" aria-hidden="true" />
      <div className="min-w-0 flex-1"><p className="truncate font-semibold text-sm" title={name}>{name}</p><p className="text-xs text-slate-500">{pdf ? 'Documento PDF' : 'Imagen'}{compact ? ' · Vista rápida' : ''}</p></div>
      {!compact && <a className="media-preview-control" href={url} download={name} aria-label={`Descargar ${name}`} title="Descargar archivo"><Download size={18} /></a>}
    </header>
    {!compact && !pdf && <div className="media-preview-tools" role="group" aria-label="Tamaño de imagen">
      <button type="button" className="media-preview-control" disabled={zoom <= 0.5} aria-label="Reducir imagen" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><Minus size={16} /></button>
      <span className="text-xs tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</span>
      <button type="button" className="media-preview-control" disabled={zoom >= 3} aria-label="Ampliar imagen" onClick={() => setZoom(z => Math.min(3, z + 0.25))}><Plus size={16} /></button>
      <button type="button" className="media-preview-control text-xs" onClick={() => setZoom(1)}><RotateCcw size={15} />Ajustar</button>
    </div>}
    <div className="media-preview-stage" tabIndex={0} role="region" aria-label={pdf ? 'Documento adjunto' : 'Imagen ampliada'}>
      {failed ? <p role="alert" className="p-6 text-sm text-slate-600">No se pudo mostrar la imagen. Puedes descargar el archivo para revisarlo.</p> : pdf ? <object data={url} type="application/pdf" aria-label={name} className="w-full h-full"><p className="p-5 text-sm">El navegador no puede mostrar este PDF. <a className="underline" href={url} download={name}>Descargar documento</a></p></object> : <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%`, minWidth: '100%', minHeight: '100%' }} className="flex items-center justify-center p-4"><img src={url} alt={name} style={{ width: `${Math.min(1, zoom) * 100}%`, height: `${Math.min(1, zoom) * 100}%` }} className="object-contain" onError={() => setFailed(true)} /></div>}
    </div>
  </section>;
}
