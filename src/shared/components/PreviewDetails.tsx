import type { ReactNode } from 'react';

export function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="preview-section"><h3>{title}</h3><div className="preview-section-body">{children}</div></section>;
}

export function PreviewDetails({ items }: { items: { label: string; value: ReactNode }[] }) {
  return <dl className="preview-details">{items.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value === null || value === undefined || value === '' ? 'Sin registrar' : value}</dd></div>)}</dl>;
}
