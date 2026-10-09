export default function StatusBadge({ value }: { value: unknown }) {
  const text = typeof value === 'boolean' ? value ? 'Activo' : 'Inactivo' : String(value ?? 'Sin estado');
  const color = /rechaz|cancel|vencido|inactiv|bajo|devuelt/i.test(text) ? 'bg-rose-50 text-rose-700' : /complet|recibid|disponible|activo|list[oa]/i.test(text) && !/no disponible/i.test(text) ? 'bg-emerald-50 text-emerald-700' : /envi|tránsito|transito/i.test(text) ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800';
  return <span className={'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ' + color}>{text}</span>;
}
