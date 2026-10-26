import { existsSync, rmSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'costo-web', 'dist');
const to = join(root, 'dist');

if (!existsSync(from)) {
  console.error('No existe costo-web/dist. Ejecuta antes el build de Vite.');
  process.exit(1);
}

if (existsSync(to)) {
  rmSync(to, { recursive: true, force: true });
}

renameSync(from, to);
console.log('dist movido a', to);
