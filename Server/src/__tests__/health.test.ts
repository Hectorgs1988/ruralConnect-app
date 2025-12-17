import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '../app';

describe('GET /health', () => {
  it('devuelve 200 y ok: true', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
    expect(typeof res.body.ts).toBe('string');
  });
});

