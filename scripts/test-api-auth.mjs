/**
 * Prueba authorize() sin servidor HTTP.
 */
import assert from 'node:assert/strict';
import { authorize } from '../lib/auth.js';

const original = process.env.CALCULADORA_API_KEY;

function fakeReq(authorization) {
  return { headers: authorization ? { authorization } : {} };
}

try {
  delete process.env.CALCULADORA_API_KEY;
  let r = authorize(fakeReq('Bearer secret'));
  assert.equal(r.ok, false);
  assert.equal(r.status, 500);

  process.env.CALCULADORA_API_KEY = 'test-key-local-only';
  r = authorize(fakeReq());
  assert.equal(r.status, 401);

  r = authorize(fakeReq('Bearer wrong'));
  assert.equal(r.status, 401);

  r = authorize(fakeReq('Bearer test-key-local-only'));
  assert.equal(r.ok, true);

  r = authorize(fakeReq('Basic test-key-local-only'));
  assert.equal(r.status, 401);

  console.log('OK test-api-auth');
} finally {
  if (original === undefined) {
    delete process.env.CALCULADORA_API_KEY;
  } else {
    process.env.CALCULADORA_API_KEY = original;
  }
}
