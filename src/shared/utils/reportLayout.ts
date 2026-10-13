/** Pack charts in their saved order, independently of the browser viewport. */
export function reportRows<T extends { order: number; width: number }>(charts: T[]): T[][] {
  const rows: T[][] = [];
  let used = 0;
  for (const chart of [...charts].sort((a, b) => a.order - b.order)) {
    const width = Math.max(30, Math.min(100, chart.width || 50));
    if (!rows.length || used + width > 100.001) { rows.push([]); used = 0; }
    rows[rows.length - 1].push({ ...chart, width });
    used += width;
  }
  return rows;
}
