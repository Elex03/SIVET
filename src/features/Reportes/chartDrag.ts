import { reportDefinitions } from './reportDefinitions';
import type { ReportType } from './reportDefinitions';
import type { ChartDrop, ChartWidget } from './ReportCanvas';

export function readChartDrop(raw: string, report: ReportType, widgets: ChartWidget[]): ChartDrop | null {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    if (value.kind === 'widget') return typeof value.id === 'string' && widgets.some(w => w.id === value.id) ? { kind: 'widget', id: value.id } : null;
    const metric = reportDefinitions.find(r => r.id === report)?.metrics.find(m => m.id === value.metric);
    return value.kind === 'template' && metric?.types.includes(value.chartType)
      ? { kind: 'template', metric: value.metric, chartType: value.chartType } : null;
  } catch { return null; }
}
