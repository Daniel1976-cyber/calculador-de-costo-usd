import { authorize } from '../lib/auth.js';
import { buscarProductos } from '../lib/catalogo.js';
import { sendJson } from '../lib/http.js';

/**
 * GET /api/productos?q=arroz
 * Catálogo de solo lectura. Sin q, devuelve el listado completo.
 */
export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, {
      error: 'method_not_allowed',
      message: 'Solo se permite GET',
    });
    return;
  }

  const auth = authorize(req);
  if (!auth.ok) {
    sendJson(res, auth.status, auth.body);
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const q = url.searchParams.get('q');
  const productos = buscarProductos(q);

  sendJson(res, 200, {
    productos,
    total: productos.length,
  });
}
