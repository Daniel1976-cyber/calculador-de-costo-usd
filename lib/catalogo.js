import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOGO_PATH = join(__dirname, '../costo-web/src/data.json');

let cache = null;

/** Catálogo de solo lectura (mismo JSON que consume la web). */
export function getCatalogo() {
  if (!cache) {
    const raw = readFileSync(CATALOGO_PATH, 'utf8');
    cache = JSON.parse(raw);
  }
  return cache;
}

/**
 * Busca productos por subcadena en nombre o id (case-insensitive).
 * Sin q, devuelve el catálogo completo.
 */
export function buscarProductos(q) {
  const productos = getCatalogo();
  if (q === undefined || q === null || String(q).trim() === '') {
    return productos;
  }
  const needle = String(q).trim().toLowerCase();
  return productos.filter((p) => {
    const nombre = typeof p.nombre === 'string' ? p.nombre.trim().toLowerCase() : '';
    const id = typeof p.id === 'string' ? p.id.toLowerCase() : '';
    return nombre.includes(needle) || id.includes(needle);
  });
}

export function encontrarProductoPorId(id) {
  const productos = getCatalogo();
  return productos.find((p) => p.id === id) || null;
}
