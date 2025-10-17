import express from 'express';
import cookieParser from 'cookie-parser';
import router from './routes/index';
import { IS_DEV } from '@lib/env';

const app = express();

app.use(cookieParser());
app.use(express.json({limit: '1mb'}));
// ルーティング
app.use('/api', router);

if (IS_DEV) { // 開発環境限定のルーティング
  app.get('/test', (_, res) => {
    res.send(`hello Express from docker!!`);
  })
}

export default app;