/**
 * @param {import('http').ServerResponse} res
 * @param {number} status
 * @param {object} body
 */
export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

/**
 * Lee el body JSON de una petición (máx. ~1 MB).
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<object>}
 */
export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    const MAX = 1_000_000;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (tooLarge) {
        return;
      }
      if (size > MAX) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (tooLarge) {
        reject(Object.assign(new Error('Body demasiado grande'), { code: 'PAYLOAD_TOO_LARGE' }));
        return;
      }
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch {
        reject(Object.assign(new Error('JSON inválido'), { code: 'INVALID_JSON' }));
      }
    });

    req.on('error', reject);
  });
}
