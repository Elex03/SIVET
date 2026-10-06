interface ReportTable { columns: { id: string; label: string }[]; data: object[] }
/** Export every row, independent of preview pagination, and each configured chart. */
export async function exportReport(title: string, subtitle: string, table: ReportTable) {
  const [{ default: jsPDF }, { toPng }] = await Promise.all([import('jspdf'), import('html-to-image')]);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const margin = 12;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const bottom = pdf.internal.pageSize.getHeight() - 14;
  let y = margin;
  const header = () => {
    pdf.setFontSize(16); pdf.setTextColor('#304a6d'); pdf.text(`SIVET · ${title}`, margin, y + 5);
    pdf.setFontSize(9); pdf.setTextColor('#64748b');
    const lines = pdf.splitTextToSize(subtitle, width);
    pdf.text(lines, margin, y + 12); y += 17 + lines.length * 4;
  };
  const page = () => { pdf.addPage(); y = margin; header(); };
  header();
  for (const chart of document.querySelectorAll<HTMLElement>('[data-report-chart]')) {
    const plot = chart.querySelector<HTMLElement>('[data-report-plot]');
    if (!plot) continue;
    const png = await toPng(plot, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const image = pdf.getImageProperties(png);
    const scale = Math.min(Math.min(width, 220) / image.width, 120 / image.height);
    const chartWidth = image.width * scale;
    const height = image.height * scale;
    if (y + height + 12 > bottom) page();
    pdf.setFontSize(11); pdf.setTextColor('#304a6d'); pdf.text(chart.dataset.reportChart || 'Gráfica', margin, y + 4);
    pdf.addImage(png, 'PNG', margin, y + 8, chartWidth, height); y += height + 14;
  }
  const columnWidth = width / Math.max(table.columns.length, 1);
  const tableHeader = () => {
    pdf.setFillColor('#304a6d'); pdf.rect(margin, y, width, 10, 'F');
    pdf.setFontSize(9); pdf.setTextColor('#ffffff');
    table.columns.forEach((c, i) => pdf.text(pdf.splitTextToSize(c.label, columnWidth - 4), margin + i * columnWidth + 2, y + 4));
    y += 10;
  };
  if (y + 25 > bottom) page();
  tableHeader();
  for (const [index, record] of table.data.entries()) {
    pdf.setFontSize(9);
    const row = record as Record<string, unknown>;
    const cells: string[][] = table.columns.map(c => pdf.splitTextToSize(String(row[c.id] ?? ''), columnWidth - 4));
    const height = Math.max(9, ...cells.map(lines => lines.length * 4 + 4));
    if (y + height > bottom) { page(); tableHeader(); }
    pdf.setFillColor(index % 2 ? '#f8fafc' : '#ffffff'); pdf.rect(margin, y, width, height, 'F');
    pdf.setTextColor('#334155');
    cells.forEach((lines, i) => pdf.text(lines, margin + i * columnWidth + 2, y + 5));
    y += height;
  }
  if (!table.data.length) { pdf.setTextColor('#64748b'); pdf.text('No se encontraron registros para estos filtros.', margin, y + 7); }
  const count = pdf.getNumberOfPages();
  for (let n = 1; n <= count; n++) { pdf.setPage(n); pdf.setFontSize(8); pdf.setTextColor('#64748b'); pdf.text(`SIVET · ${new Date().toLocaleDateString('es-NI')} · Página ${n} de ${count}`, margin, bottom + 7); }
  pdf.save(`${title.replace(/[^a-z0-9áéíóúñ]/gi, '_')}.pdf`);
}
