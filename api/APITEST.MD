# Jest supertest での APIテスト

## 1. 必要ライブラリのインストール
```
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

- `jest` Jest本体
- `ts-jest` TSファイルのままJestでテスト可能にするためのトランスパイら
- `@types/jest` Jestの型定義
- `supertest` Expressを叩いて疑似的にRequestを送信する
- `@types/supertest` supertestの型定義

## 2. Jestの設定ファイルの作成
- `jest.config.ts`をプロジェクト直下に作成
```
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // テストファイルのパターン
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  // tsconfig が src を見てるならこのままでOK
  moduleFileExtensions: ['ts', 'js', 'json'],
};

export default config;
```

- `package.json`にスクリプト追加
```
{
  "scripts": {
    "test": "jest"
  }
}
```

## 3. Expressアプリを「テストからimportできる形」にする
- テストでは`server.ts`で`app.listen()`しない
- `app`のみexportしてあげる

※すでに`app`がexportされているので読み飛ばしてOK

## 4. supertestで「初めてのテスト」を書く
- テスト用エンドポイント`GET /test`
- `__test__/test.test.ts`
```
import request from 'supertest';
import app from '../src/app';

describe('GET /test', () => {
  it('200 が返って ok: true であること', async () => {
    const res = await request(app).get('/test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
```