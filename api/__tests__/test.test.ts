// __tests__/test.test.ts
import request from 'supertest';

// 1. まずモック定義（app を import する前！）
jest.mock('@lib/env', () => ({
  IS_DEV: true, // /test ルートを有効にするため
}));

jest.mock('@lib/redis', () => ({
  ensureRedis: jest.fn(), // app.ts の ensureRedis() 呼び出しを空振りに
  redis: {
    ping: jest.fn().mockResolvedValue('PONG'),
    set: jest.fn().mockResolvedValue(null),
    get: jest.fn().mockResolvedValue(null),
  },
}));

// 2. モックが効いた状態で app を import
import app from '../src/app';

// 3. /test に対するシンプルなテスト
describe('GET /test', () => {
  it('200 & { ok: true } が返ること', async () => {
    const res = await request(app).get('/test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
