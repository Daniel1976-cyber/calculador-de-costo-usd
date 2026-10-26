/** Factor fijo usado en la app (App.jsx / excelcosto.py). No modificar. */
export const FACTOR_USD = 120;

/**
 * Calcula los campos de costo de una línea (producto + cantidad).
 * Fórmulas idénticas a confirmarCantidadLibre en App.jsx.
 */
export function calcularLinea(producto, cantidad) {
  return {
    cantidadUsada: cantidad,
    costoTotalLinea: producto.precio * cantidad,
    costo_usd: (producto.precio_usd || 0) * cantidad,
    precio_item_total:
      (((producto.precio_usd || 0) * FACTOR_USD) + (producto.precio_cup || 0)) * cantidad,
  };
}

/**
 * Agrega totales a partir de ítems que ya tienen campos de línea calculados.
 */
export function calcularTotales(items) {
  return {
    costoTotal: items.reduce((acc, item) => acc + item.costoTotalLinea, 0),
    costoUsdTotal: items.reduce((acc, item) => acc + (item.costo_usd || 0), 0),
    precioTotalMenu: items.reduce((acc, item) => acc + (item.precio_item_total || 0), 0),
  };
}

/**
 * Genera el objeto reporte (mismas fórmulas que generarReporte en App.jsx).
 * @param {{ items: object[], precioVenta: number, titulo: string, fecha?: string }} opts
 */
export function calcularReporte({ items, precioVenta, titulo, fecha }) {
  const { costoTotal, costoUsdTotal, precioTotalMenu } = calcularTotales(items);
  const costoPorPeso = costoTotal / precioVenta;
  const porcentajeUsd =
    precioTotalMenu > 0 ? (costoUsdTotal * FACTOR_USD) / precioTotalMenu : 0;

  return {
    titulo,
    fecha: fecha ?? new Date().toLocaleString(),
    modo: 'Menú Libre',
    items: [...items],
    costoTotal,
    costoUsdTotal,
    precioTotalMenu,
    porcentajeUsd,
    precioVenta,
    costoPorPeso,
  };
}
