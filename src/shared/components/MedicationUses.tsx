export default function MedicationUses({ value }: { value?: string | null }) {
  return <div><h3 className="font-bold text-[#304a6d] mb-2">Para qué sirve</h3><p className="whitespace-pre-line break-words text-sm text-slate-600">{value?.trim() || 'Uso no documentado'}</p></div>;
}
