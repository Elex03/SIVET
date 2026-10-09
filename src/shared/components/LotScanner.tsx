import { useEffect, useRef, useState } from 'react';
import { inputClass } from '../styles/formStyles';
type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorConstructor = { new(options: { formats: string[] }): Detector; getSupportedFormats: () => Promise<string[]> };
export default function LotScanner({ onScan }: { onScan: (code: string) => void }) {
  const [code, setCode] = useState(''); const [active, setActive] = useState(false); const [error, setError] = useState('');
  const video = useRef<HTMLVideoElement>(null); const callback = useRef(onScan);
  useEffect(() => { callback.current = onScan; }, [onScan]);
  useEffect(() => {
    if (!active) return;
    let stopped = false; let stream: MediaStream | undefined; let timer: ReturnType<typeof setTimeout>;
    const start = async () => {
      try {
        const Barcode = (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
        if (!Barcode || !navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador no admite el lector por cámara. Escribe el código o utiliza un lector USB/Bluetooth.');
        const formats = await Barcode.getSupportedFormats();
        const detector = new Barcode({ formats });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        if (video.current) { video.current.srcObject = stream; await video.current.play(); }
        const detect = async () => {
          if (stopped || !video.current) return;
          try {
            const found = await detector.detect(video.current);
            if (stopped) return;
            if (found[0]?.rawValue) { callback.current(found[0].rawValue.trim()); setActive(false); return; }
          } catch { /* Retry while a video frame becomes available. */ }
          if (!stopped) timer = setTimeout(() => void detect(), 300);
        };
        void detect();
      } catch (e) { if (!stopped) { setError(e instanceof Error && e.name === 'NotAllowedError' ? 'No se autorizó la cámara. Puedes escribir el código.' : e instanceof Error ? e.message : 'No se pudo iniciar la cámara.'); setActive(false); } }
    };
    void start();
    return () => { stopped = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()); };
  }, [active]);
  const submit = () => { if (code.trim()) { onScan(code.trim()); setCode(''); } };
  return <section className="bg-blue-50/40 border border-blue-100 rounded-xl p-3 space-y-3"><label className="block text-xs text-slate-600 font-semibold">Código QR / barras del lote<input className={inputClass} value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }} placeholder="Escanea o escribe el código del lote" /></label><div className="flex flex-wrap gap-3"><button type="button" className="text-blue-700 text-sm font-semibold" onClick={submit} disabled={!code.trim()}>Buscar lote</button><button type="button" className="text-blue-700 text-sm font-semibold" onClick={() => { setError(''); setActive(v => !v); }}>{active ? 'Detener cámara' : 'Escanear con cámara'}</button></div>{active && <video ref={video} muted playsInline className="w-full max-h-56 rounded-xl bg-slate-900" />}{error && <p role="status" className="text-xs text-amber-700">{error}</p>}<p className="text-xs text-slate-500">El código identifica el lote; la cantidad, fecha y verificación se revisan por separado.</p></section>;
}
