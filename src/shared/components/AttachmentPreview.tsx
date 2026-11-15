import { useEffect, useState } from 'react';
import useProtectedAsset from './useProtectedAsset';
import MediaPreview from './MediaPreview';
export default function AttachmentPreview({ name, content, compact = false }: { name: string; content: string; compact?: boolean }) {
  const [local, setLocal] = useState({ source: '', url: '', error: false });
  const valid = /^data:(application\/pdf|image\/(png|jpeg|webp));base64,/.test(content);
  const asset = useProtectedAsset(content.startsWith('api:') ? content : undefined);
  useEffect(() => {
    let active = true; let objectUrl = '';
    if (valid) void Promise.resolve().then(() => {
      const [header, encoded] = content.split(',');
      const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
      objectUrl = URL.createObjectURL(new Blob([bytes], { type: header.slice(5).split(';')[0] }));
      if (active) setLocal({source:content,url:objectUrl,error:false}); else URL.revokeObjectURL(objectUrl);
    }).catch(() => { if (active) setLocal({source:content,url:'',error:true}); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [content, valid]);
  const protectedFile = content.startsWith('api:');
  const url = protectedFile ? asset.url : local.source === content ? local.url : '';
  const error = protectedFile ? asset.error : local.source === content && local.error;
  if (!protectedFile && !valid) return <p role="alert" className="preview-message">Este formato no permite vista previa. Adjunta un PDF o una imagen PNG, JPG o WebP.</p>;
  if (error) return <p role="alert" className="preview-message">No se pudo abrir el adjunto. Cierra la vista e inténtalo nuevamente; si persiste, revisa el archivo original.</p>;
  if (!url) return <p role="status" className="preview-message">Preparando vista previa…</p>;
  return <MediaPreview key={url} url={url} name={name} compact={compact} pdf={content.startsWith('data:application/pdf;') || asset.mime === 'application/pdf'} />;
}
