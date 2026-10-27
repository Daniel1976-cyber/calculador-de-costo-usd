import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { getCatalogo } from '../lib/catalogo.js';
import chatHandler from '../api/chat.js';

process.env.GEMINI_API_KEY = 'gemini-test-key-not-real';
process.env.CALCULADORA_API_KEY = 'calculator-test-key-not-real';

const product = getCatalogo()[0];
const searchQuery = product.nombre.trim().slice(0, 5);
const originalFetch = globalThis.fetch;
const httpFetch = globalThis.fetch;
const geminiResponses = [];
let geminiRequests = 0;
const geminiRequestBodies = [];

function functionCall(name, args) {
  return {
    candidates: [{
      content: {
        role: 'model',
        parts: [{ functionCall: { name, args } }],
      },
    }],
  };
}

function textResponse(text) {
  return {
    candidates: [{
      content: {
        role: 'model',
        parts: [{ text }],
      },
    }],
  };
}

globalThis.fetch = async (_url, options) => {
  geminiRequests += 1;
  const headers = new Headers(options.headers);
  assert.equal(headers.get('x-goog-api-key'), 'gemini-test-key-not-real');
  const bodyText = String(options.body);
  assert.ok(!bodyText.includes('gemini-test-key-not-real'));
  assert.ok(!bodyText.includes('calculator-test-key-not-real'));
  geminiRequestBodies.push(JSON.parse(bodyText));
  const next = geminiResponses.shift();
  assert.ok(next, 'respuesta Gemini simulada no configurada');
  return Response.json(next);
};

const server = createServer((req, res) => {
  if (req.url === '/api/chat') {
    chatHandler(req, res);
    return;
  }
  res.statusCode = 404;
  res.end();
});

function enqueue(...responses) {
  geminiResponses.push(...responses);
}

async function post(body) {
  return httpFetch(`http://127.0.0.1:${server.address().port}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `${Math.random()}`,
    },
    body: JSON.stringify(body),
  });
}

try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  let response = await post({ message: '   ' });
  assert.equal(response.status, 400, 'mensaje vacío debe ser rechazado');
  assert.equal(geminiRequests, 0, 'solicitudes inválidas no deben consumir Gemini');

  response = await post({ message: 'x'.repeat(1_201) });
  assert.equal(response.status, 400, 'mensaje demasiado largo debe ser rechazado');

  enqueue(
    functionCall('calcular_reporte', {
      titulo: 'Sin confirmar',
      precioVenta: 900,
      items: [{
        id: product.id,
        cantidad: 1,
        unidadConfirmada: product.unidad,
      }],
    }),
    textResponse('Necesito que confirmes los productos, cantidades y unidades antes de calcular.'),
  );
  response = await post({
    message: 'Quiero calcular una preparación.',
    history: [],
  });
  assert.equal(response.status, 200);
  let result = await response.json();
  assert.equal(result.report, null, 'no debe calcular sin confirmación explícita');
  assert.match(result.reply, /confirmes/i);

  enqueue(
    functionCall('buscar_productos', { q: searchQuery }),
    functionCall('calcular_reporte', {
      titulo: 'Prueba de chat',
      precioVenta: 900,
      items: [{
        id: product.id,
        cantidad: 2,
        unidadConfirmada: product.unidad,
      }],
    }),
    textResponse('El reporte calculado aparece separado de esta explicación.'),
  );
  response = await post({
    message: 'Sí, confirmo la propuesta.',
    history: [
      { role: 'assistant', content: 'Confirma que quieres calcular 2 u del producto seleccionado a 900.' },
    ],
  });
  assert.equal(response.status, 200);
  result = await response.json();
  const toolErrors = geminiRequestBodies.flatMap((request) =>
    (request.contents || []).flatMap((entry) =>
      (entry.parts || [])
        .map((part) => part.functionResponse?.response?.result?.error)
        .filter(Boolean)
    )
  );
  assert.ok(result.report, `el reporte debería existir; errores de herramienta: ${toolErrors.join('; ')}`);
  assert.equal(result.report.titulo, 'Prueba de chat');
  assert.equal(result.report.items[0].id, product.id);
  assert.equal(result.report.items[0].precio, product.precio);
  assert.equal(result.report.costoTotal, product.precio * 2);
  assert.match(result.reply, /reporte calculado/i);

  enqueue(
    functionCall('buscar_productos', { q: searchQuery }),
    functionCall('calcular_reporte', {
      titulo: 'Unidad incompatible',
      precioVenta: 900,
      items: [{
        id: product.id,
        cantidad: 2,
        unidadConfirmada: 'kg',
      }],
    }),
    textResponse('La unidad indicada no coincide con el catálogo; necesito que la confirmes.'),
  );
  response = await post({
    message: 'Sí, confirmo la propuesta.',
    history: [
      { role: 'assistant', content: 'Confirma que quieres calcular 2 kg del producto seleccionado a 900.' },
    ],
  });
  assert.equal(response.status, 200);
  result = await response.json();
  assert.equal(result.report, null, 'una unidad distinta a la del catálogo no debe calcularse');

  assert.ok(
    geminiRequestBodies.every((request) =>
      request.tools?.[0]?.functionDeclarations?.some((tool) => tool.name === 'buscar_productos') &&
      request.tools?.[0]?.functionDeclarations?.some((tool) => tool.name === 'calcular_reporte')
    ),
    'Gemini debe recibir solo las herramientas declaradas',
  );
  assert.equal(geminiResponses.length, 0);

  console.log('OK test-chat-api');
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  globalThis.fetch = originalFetch;
}
