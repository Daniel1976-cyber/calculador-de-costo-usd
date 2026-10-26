/**
 * Prueba local de paridad UI ↔ API (mismas fórmulas + catálogo).
 * No arranca un servidor HTTP; ejercita la misma lógica que api/calcular.js.
 */
import assert from 'node:assert/strict';
import {
  calcularLinea,
  calcularTotales,
  calcularReporte,
  FACTOR_USD,
} from '../costo-web/src/lib/calcular.js';
import { buscarProductos, encontrarProductoPorId, getCatalogo } from '../lib/catalogo.js';

const catalogo = getCatalogo();
assert.ok(Array.isArray(catalogo) && catalogo.length > 0, 'catálogo vacío');
assert.equal(FACTOR_USD, 120);

const p1 = catalogo[0];
const p2 = catalogo.find((p) => p.id !== p1.id) || catalogo[0];

// --- Fórmulas línea vs inline original App.jsx ---
const cantidad = 1.25;
const linea = calcularLinea(p1, cantidad);
assert.equal(linea.costoTotalLinea, p1.precio * cantidad);
assert.equal(linea.costo_usd, (p1.precio_usd || 0) * cantidad);
assert.equal(
  linea.precio_item_total,
  (((p1.precio_usd || 0) * 120) + (p1.precio_cup || 0)) * cantidad
);

// --- Flujo API: precios solo del catálogo (ignorar body) ---
const bodyItems = [
  { id: p1.id, cantidad: 0.5, precio: 999999, precio_usd: 999, precio_cup: 999 },
  { id: p2.id, cantidad: 2 },
];

const itemsCalculados = bodyItems.map((raw) => {
  const producto = encontrarProductoPorId(String(raw.id));
  assert.ok(producto, `no encontrado ${raw.id}`);
  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    precio_cup: producto.precio_cup,
    precio_usd: producto.precio_usd,
    unidad: producto.unidad,
    ...calcularLinea(producto, Number(raw.cantidad)),
  };
});

assert.notEqual(itemsCalculados[0].precio, 999999, 'no debe usar precio del body');

const precioVenta = 2500;
const titulo = 'prueba paridad';
const reporte = calcularReporte({
  items: itemsCalculados,
  precioVenta,
  titulo,
  fecha: 'fixed',
});

const tot = calcularTotales(itemsCalculados);
assert.equal(reporte.costoTotal, tot.costoTotal);
assert.equal(reporte.costoUsdTotal, tot.costoUsdTotal);
assert.equal(reporte.precioTotalMenu, tot.precioTotalMenu);
assert.equal(reporte.costoPorPeso, tot.costoTotal / precioVenta);
assert.equal(
  reporte.porcentajeUsd,
  tot.precioTotalMenu > 0 ? (tot.costoUsdTotal * 120) / tot.precioTotalMenu : 0
);
assert.equal(reporte.modo, 'Menú Libre');
assert.equal(reporte.titulo, titulo);

// --- Búsqueda productos ---
const todos = buscarProductos();
assert.equal(todos.length, catalogo.length);

const fragmento = (p1.nombre || '').trim().slice(0, 5).toLowerCase();
const filtrados = buscarProductos(fragmento);
assert.ok(filtrados.length >= 1);
assert.ok(filtrados.every((p) => p.nombre.toLowerCase().includes(fragmento) || p.id.toLowerCase().includes(fragmento)));

assert.equal(encontrarProductoPorId('__no_existe__'), null);

console.log('OK test-api-parity');
console.log(JSON.stringify({
  items: itemsCalculados.length,
  costoTotal: reporte.costoTotal,
  costoPorPeso: reporte.costoPorPeso,
  porcentajeUsd: reporte.porcentajeUsd,
  catalogoTotal: catalogo.length,
  filtrados: filtrados.length,
}, null, 2));
