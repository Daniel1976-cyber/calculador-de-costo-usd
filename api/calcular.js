import { authorize } from '../lib/auth.js';
import { encontrarProductoPorId } from '../lib/catalogo.js';
import { sendJson, readJsonBody } from '../lib/http.js';
import {
  calcularLinea,
  calcularReporte,
} from '../costo-web/src/lib/calcular.js';

/**
 * POST /api/calcular
 * Calcula costo/reporte usando precios del catálogo del servidor.
 * Ignora cualquier precio enviado en el body.
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, {
      error: 'method_not_allowed',
      message: 'Solo se permite POST',
    });
    return;
  }

  const auth = authorize(req);
  if (!auth.ok) {
    sendJson(res, auth.status, auth.body);
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    if (err && err.code === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, {
        error: 'payload_too_large',
        message: 'Body demasiado grande',
      });
      return;
    }
    sendJson(res, 400, {
      error: 'bad_request',
      message: 'JSON inválido',
    });
    return;
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    sendJson(res, 400, {
      error: 'bad_request',
      message: 'Body debe ser un objeto JSON',
    });
    return;
  }

  const titulo =
    typeof body.titulo === 'string' ? body.titulo.trim() : '';
  if (!titulo) {
    sendJson(res, 400, {
      error: 'bad_request',
      message: 'titulo es obligatorio',
    });
    return;
  }

  const precioVenta = Number(body.precioVenta);
  if (!Number.isFinite(precioVenta) || precioVenta <= 0) {
    sendJson(res, 400, {
      error: 'bad_request',
      message: 'precioVenta debe ser un número mayor que 0',
    });
    return;
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    sendJson(res, 400, {
      error: 'bad_request',
      message: 'items debe ser un array no vacío',
    });
    return;
  }

  const itemsCalculados = [];

  for (let i = 0; i < body.items.length; i++) {
    const raw = body.items[i];
    if (!raw || typeof raw !== 'object') {
      sendJson(res, 400, {
        error: 'bad_request',
        message: `items[${i}] debe ser un objeto`,
      });
      return;
    }

    const id = raw.id != null ? String(raw.id) : '';
    if (!id) {
      sendJson(res, 400, {
        error: 'bad_request',
        message: `items[${i}].id es obligatorio`,
      });
      return;
    }

    const cantidad = Number(raw.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      sendJson(res, 400, {
        error: 'bad_request',
        message: 'cantidad debe ser un número mayor que 0',
      });
      return;
    }

    const producto = encontrarProductoPorId(id);
    if (!producto) {
      sendJson(res, 404, {
        error: 'not_found',
        message: `Producto no encontrado: ${id}`,
      });
      return;
    }

    // Precios solo del catálogo; se ignoran precio/precio_cup/precio_usd del body.
    itemsCalculados.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      precio_cup: producto.precio_cup,
      precio_usd: producto.precio_usd,
      unidad: producto.unidad,
      ...calcularLinea(producto, cantidad),
    });
  }

  const reporte = calcularReporte({
    items: itemsCalculados,
    precioVenta,
    titulo,
  });

  sendJson(res, 200, reporte);
}
