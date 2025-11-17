import express from 'express';
import cookieParser from 'cookie-parser';
import router from './routes/index';
import { IS_DEV } from '@lib/env';
import { ensureRedis, redis } from '@lib/redis';
import setRequestIdAndTimestamp from '@middleware/setRequestIdAndTimestamp';
import errorHandler from '@middleware/errorHandler';

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// DBクライアントの起動
// redis
ensureRedis();

/**
 * ルーティング
 * 
 * 1. setRequestIdAndTime: 全リクエスト共通で requestId, requestTimestamp を付与
 * 2. /api あてのリクエストをルーティング
 * 3. request 処理中に発生したエラーを共通処理
 */
app.use(setRequestIdAndTimestamp);
app.use('/api', router);
app.use(errorHandler);

if (IS_DEV) { // 開発環境限定のルーティング
  app.get('/test', (_req, res) => {
    res.send(`hello Express from docker!!`);
  })
}

// ヘルスチェック
app.get("/health/redis", async (_req, res) => {
  try {
    const pong = await redis.ping();  // 疎通
    res.json({ ok: true, pong });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// サンプル：セット/ゲット
app.get("/demo/set", async (_req, res) => {
  await redis.set("ln:sessions:demo", JSON.stringify({ foo: "bar" }), {
    EX: 60,
    NX: true,
  });
  res.json({ ok: true });
});

app.get("/demo/get", async (_req, res) => {
  await ensureRedis();
  const raw = await redis.get("ln:sessions:demo");
  res.json({ value: raw ? JSON.parse(raw) : null });
});

export default app;