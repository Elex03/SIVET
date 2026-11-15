import { Component } from 'react';
import type { ReactNode } from 'react';

export default class ChartErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state: { error: string | null } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : 'Error de representación de la gráfica.' };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <div data-chart-error role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">No se pudo mostrar esta gráfica.</p>
      <p className="mt-2">Tus filtros y los registros de la tabla se conservan. Puedes reintentar, cambiar el tipo de gráfica o quitarla.</p>
      <details className="mt-3 break-words"><summary>Detalle del error para soporte</summary><p>{this.state.error}</p></details>
      <button type="button" className="mt-3 font-semibold underline" onClick={() => this.setState({ error: null })}>Reintentar gráfica</button>
    </div>;
  }
}
