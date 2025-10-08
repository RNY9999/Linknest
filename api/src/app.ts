import express from 'express';
import { IS_DEV } from '@lib/env';

const app = express();

if (IS_DEV) { // 開発環境限定のルーティング
  app.get('/test', (_, res) => {
    res.send(`hello Express from docker!!`);
  })
}

export default app;