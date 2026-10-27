import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import calcularHandler from '../api/calcular.js';
import productosHandler from '../api/productos.js';
import { getCatalogo } from '../lib/catalogo.js';

const originalApiKey = process.env.CALCULADORA_API_KEY;
const testApiKey = 'local-http-test-key';
process.env.CALCULADORA_API_KEY = testApiKey;

const server = createServer((req, res) => {
  if (req.url?.startsWith('/api/productos')) {
    productosHandler(req, res);
    return;
  }
  if (req.url === '/api/calcular') {
    calcularHandler(req, res);
    return;
  }
  res.statusCode = 404;
  res.end();
});

function request(path, options = {}) {
  return fetch(`http://127.0.0.1:${server.address().port}${path}`, options);
}

try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const catalogo = getCatalogo();
  assert.ok(catalogo.length > 0, 'catálogo vacío');
  const producto = catalogo[0];
  const authHeaders = { Authorization: `Bearer ${testApiKey}` };

  delete process.env.CALCULADORA_API_KEY;
  let response = await request('/api/productos');
  assert.equal(response.status, 500, 'sin clave configurada el servidor debe responder 500');
  process.env.CALCULADORA_API_KEY = testApiKey;

  response = await request('/api/productos');
  assert.equal(response.status, 401, 'productos debe exigir autenticación');

  response = await request('/api/calcular', { method: 'POST' });
  assert.equal(response.status, 401, 'cálculo debe exigir autenticación');

  response = await request('/api/productos', {
    method: 'POST',
    headers: authHeaders,
  });
  assert.equal(response.status, 405, 'productos debe aceptar solo GET');

  response = await request('/api/productos', {
    headers: authHeaders,
  });
  assert.equal(response.status, 200);
  const listado = await response.json();
  assert.equal(listado.total, catalogo.length, 'debe devolver el catálogo completo');
  assert.equal(listado.productos.length, catalogo.length);

  const fragmento = producto.nombre.trim().slice(0, 5);
  response = await request(`/api/productos?q=${encodeURIComponent(fragmento)}`, {
    headers: authHeaders,
  });
  assert.equal(response.status, 200);
  const busqueda = await response.json();
  assert.ok(busqueda.total > 0, 'la búsqueda debe devolver coincidencias');
  assert.ok(busqueda.productos.every((item) =>
    item.nombre.toLowerCase().includes(fragmento.toLowerCase()) ||
    item.id.toLowerCase().includes(fragmento.toLowerCase())
  ));

  response = await request('/api/calcular', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Prueba HTTP local',
      precioVenta: 900,
      items: [{
        id: producto.id,
        cantidad: 1,
        precio: 987654321,
        precio_cup: 987654321,
        precio_usd: 987654321,
      }],
    }),
  });
  assert.equal(response.status, 200, 'cálculo válido debe responder 200');
  const reporte = await response.json();
  assert.equal(reporte.items[0].precio, producto.precio, 'precio debe venir del catálogo');
  assert.equal(reporte.items[0].precio_cup, producto.precio_cup);
  assert.equal(reporte.items[0].precio_usd, producto.precio_usd);

  response = await request('/api/calcular', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Cantidad con tipo incorrecto',
      precioVenta: 900,
      items: [{ id: producto.id, cantidad: true }],
    }),
  });
  assert.equal(response.status, 400, 'cantidad debe ser un número');

  response = await request('/api/calcular', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'ID con tipo incorrecto',
      precioVenta: 900,
      items: [{ id: 123, cantidad: 1 }],
    }),
  });
  assert.equal(response.status, 400, 'id debe ser texto');

  response = await request('/api/calcular', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: '{',
  });
  assert.equal(response.status, 400, 'JSON inválido debe responder 400');

  response = await request('/api/calcular', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ padding: 'x'.repeat(1_000_001) }),
  });
  assert.equal(response.status, 413, 'cuerpo demasiado grande debe responder 413');

  response = await request('/api/calcular', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Prueba inválida',
      precioVenta: 900,
      items: [{ id: producto.id, cantidad: 0 }],
    }),
  });
  assert.equal(response.status, 400, 'cantidad no positiva debe responder 400');

  response = await request('/api/calcular', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Producto inexistente',
      precioVenta: 900,
      items: [{ id: '__producto_inexistente__', cantidad: 1 }],
    }),
  });
  assert.equal(response.status, 404, 'producto inexistente debe responder 404');

  response = await request('/api/calcular', {
    method: 'GET',
    headers: authHeaders,
  });
  assert.equal(response.status, 405, 'cálculo debe aceptar solo POST');

  console.log('OK test-api-http');
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  if (originalApiKey === undefined) {
    delete process.env.CALCULADORA_API_KEY;
  } else {
    process.env.CALCULADORA_API_KEY = originalApiKey;
  }
}
