/** One calculation for the form and inventory mutation. Quantities refer to stock, not doses. */
export function dispatchQuantity(
  stock: number,
  quantity: number,
  inMl: boolean,
  contentMl?: number,
) {
  const factor = inMl ? contentMl || 0 : 1;
  const available = Math.round(stock * factor * 1e9) / 1e9;
  const baseQuantity = factor > 0 ? quantity / factor : NaN;
  const remainingBase = Math.round((stock - baseQuantity) * 1e9) / 1e9;
  let error = "";
  if (!Number.isFinite(factor) || factor <= 0)
    error = "Falta configurar el contenido en ml de esta presentación.";
  else if (!Number.isFinite(quantity) || quantity <= 0)
    error = "Indica una cantidad mayor que cero.";
  else if (!inMl && !Number.isInteger(quantity))
    error = "Indica una cantidad entera de unidades completas.";
  else if (
    Math.abs(quantity * 1000 - Math.round(quantity * 1000)) >= 1e-7 ||
    baseQuantity < 0.000001
  )
    error = "Usa hasta tres decimales y una cantidad válida.";
  else if (!Number.isFinite(stock) || stock + 1e-9 < baseQuantity)
    error = "Stock insuficiente para esta cantidad.";
  return {
    available,
    baseQuantity,
    remainingBase: Math.max(0, remainingBase),
    remaining: Math.round((available - quantity) * 1e9) / 1e9,
    error,
  };
}

/** Describe physical units without asking the user to interpret fractional bottles. */
export function stockLabel(stock: number, unit = 'unidades', contentMl?: number) {
  const whole = Math.floor(stock);
  const remainder = Math.round((stock - whole) * (contentMl || 1) * 1e9) / 1e9;
  const format = (n: number) => n.toLocaleString('es-NI', { maximumFractionDigits: 9 });
  if (!remainder) return format(whole) + ' ' + unit;
  return format(whole) + ' ' + unit + ' completos y ' + format(remainder) + (contentMl ? ' ml restantes' : ' de unidad restante');
}
