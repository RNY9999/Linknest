import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const UNDEFINED_PORT: number = 9989;
const PORT: number = Number(process.env.PORT ?? UNDEFINED_PORT);

const main = async () => {
  try {
    // サーバの起動
    app.listen(PORT, () => {
      console.log(`${process.env.NODE_ENV ?? 'unknown'} Server is running at http://localhost:${PORT}`);
    })
  } catch (error) {
    console.error('✖ サーバ起動失敗: ', error);
    process.exit(1);
  }
};

main();