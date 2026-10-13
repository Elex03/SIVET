import { reportRows } from './reportLayout';
interface ReportTable { columns: { id: string; label: string }[]; data: object[] }
/** Export every row, independent of preview pagination, and each configured chart. */
export async function exportReport(title: string, subtitle: string, table: ReportTable, includeCharts = true) {
  const [{ default: jsPDF }, { toPng }] = await Promise.all([import('jspdf'), import('html-to-image')]);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const margin = 12;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const bottom = pdf.internal.pageSize.getHeight() - 14;
  let y = margin;
  const header = () => {
    pdf.setFontSize(15); pdf.setTextColor('#304a6d'); const titleLines = pdf.splitTextToSize(`SIVET · ${title}`, width); pdf.text(titleLines, margin, y + 5); y += (titleLines.length - 1) * 6;
    pdf.setFontSize(9); pdf.setTextColor('#64748b');
    const lines = pdf.splitTextToSize(subtitle, width);
    pdf.text(lines, margin, y + 12); y += 17 + lines.length * 4;
  };
  const page = () => { pdf.addPage(); y = margin; header(); };
  header();
  await document.fonts.ready;
  const charts = Array.from(includeCharts ? document.querySelectorAll<HTMLElement>('[data-report-chart]') : []).filter(chart => chart.getClientRects().length).map((chart, index) => ({ chart, order: Number(chart.dataset.reportOrder ?? index), width: Number(chart.dataset.reportWidth || 100) }));
  const gap = 5;
  for (const row of reportRows(charts)) {
    const captured = [];
    for (const {chart, width: percent} of row) {
      const plot = chart.querySelector<HTMLElement>('[data-report-plot]');
      if (!plot) continue;
      const scrollers = [...plot.querySelectorAll<HTMLElement>('[data-chart-scroll]')].map(element => ({ element, style: element.getAttribute('style') }));
      let png: string;
      try {
        scrollers.forEach(({element}) => { element.style.maxHeight = 'none'; element.style.overflow = 'visible'; });
        png = await toPng(plot, { pixelRatio: 2, backgroundColor: '#ffffff' });
      } finally { scrollers.forEach(({element, style}) => { if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style); }); }
      const image = pdf.getImageProperties(png);
      const cellWidth = (width + gap) * percent / 100 - gap;
      pdf.setFontSize(10);
      const titleLines: string[] = pdf.splitTextToSize(chart.dataset.reportChart || 'Gráfica', cellWidth);
      const imageHeight = Math.min(cellWidth * image.height / image.width, 150);
      const imageWidth = imageHeight * image.width / image.height;
      captured.push({ png, cellWidth, titleLines, imageHeight, imageWidth, height: titleLines.length * 4 + 3 + imageHeight });
    }
    const rowHeight = Math.max(0, ...captured.map(c => c.height));
    if (y + rowHeight > bottom) page();
    let x = margin;
    for (const chart of captured) {
      pdf.setFontSize(10); pdf.setTextColor('#304a6d');
      pdf.text(chart.titleLines, x, y + 4);
      pdf.addImage(chart.png, 'PNG', x + (chart.cellWidth - chart.imageWidth) / 2, y + chart.titleLines.length * 4 + 3, chart.imageWidth, chart.imageHeight);
      x += chart.cellWidth + gap;
    }
    y += rowHeight + 9;
  }
  const columnWidth = width / Math.max(table.columns.length, 1);
  const tableHeader = () => {
    pdf.setFontSize(8); const labels: string[][] = table.columns.map(c => pdf.splitTextToSize(c.label, columnWidth - 4));
    const height = Math.max(10, ...labels.map(lines => lines.length * 3.5 + 5));
    pdf.setFillColor('#304a6d'); pdf.rect(margin, y, width, height, 'F'); pdf.setTextColor('#ffffff');
    labels.forEach((lines, i) => pdf.text(lines, margin + i * columnWidth + 2, y + 4));
    y += height;
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
