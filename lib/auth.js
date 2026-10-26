/**
 * Valida Authorization: Bearer contra CALCULADORA_API_KEY (solo servidor).
 * @param {import('http').IncomingMessage} req
 * @returns {{ ok: true } | { ok: false, status: number, body: object }}
 */
export function authorize(req) {
  const configured = process.env.CALCULADORA_API_KEY;
  if (!configured) {
    return {
      ok: false,
      status: 500,
      body: {
        error: 'server_error',
        message: 'API key no configurada en el servidor',
      },
    };
  }

  const header = req.headers.authorization || req.headers.Authorization || '';
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'unauthorized',
        message: 'API key inválida o ausente',
      },
    };
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token || token !== configured) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'unauthorized',
        message: 'API key inválida o ausente',
      },
    };
  }

  return { ok: true };
}
