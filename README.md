# Linknest

## commitメッセージに関して

### タイプ
- feat:     新機能の追加
- fix:      バグ修正
- docs:     ドキュメントのみの変更
- style:    コードのフォーマット（機能変更なし）
- refactor: リファクタリング（挙動変更なし）
- perf:     パフォーマンス改善
- test:     テスト追加・修正
- chore:    ビルド設定・依存更新・CI関連など（その他READMEの更新なども含む）
- hotfix:   緊急修正（本番障害など）

### commitに関して

下記のように作成

```
git commit -m "[issue番号] [タイプ]: 作業内容"

(ex)
git commit -m "#1 chore: commitメッセージに関するREADMEの作成"
```

## APIサーバに関して
- ルートフォルダは`api`

## 環境概要

| 項目      | 内容                      |
| ------- | ----------------------- |
| 言語      | TypeScript (Node.js 20) |
| フレームワーク | Express                 |
| ホットリロード | nodemon + ts-node       |
| 環境変数管理  | dotenv + .env           |
| 開発環境    | Docker / docker-compose |


## 環境設定に関して

| シナリオ                 | 実行コマンド                                                                                |
| -------------------- | ------------------------------------------------------------------------------------- |
| 初回セットアップ             | `docker-compose run --rm api npm ci`                                                  |
| サーバ起動                | `docker-compose up`                                                                   |
| 依存更新（package.json変更） | `docker-compose run --rm api npm ci`                                                  |
| 完全リセット（依存含む）         | `docker-compose down -v` → `docker-compose run --rm api npm ci` → `docker-compose up` |

## Prisma セットアップ手順（Docker + PostgreSQL）
### 前提

API（Node/Express）は api コンテナで動作

DB は postgres コンテナ（ホスト名 postgres）

.env に POSTGRES_URL を定義済み
例：
```
POSTGRES_URL=postgresql://devuser:devpass@postgres:5432/devdb?schema=public
```
### 1. 依存インストール

VSCode などローカルで実行（推奨）
```
npm i @prisma/client
npm i -D prisma
```

完全にDocker内で閉じる場合はこちら：
```
docker compose exec api npm i @prisma/client
docker compose exec api npm i -D prisma
```

確認：
```
npx prisma -v
```
### 2. Prisma 初期化
```
docker compose exec api npx prisma init
```

prisma/ フォルダと prisma/schema.prisma が作成されます

.env は既存をそのまま使用でOK（POSTGRES_URL を使う）

### 3. schema.prisma を編集

例（最小の User モデル）：
```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
### 4. クライアント生成（型生成）
```
docker compose exec api npx prisma generate
```
### 5. マイグレーション（DBへ反映）
```
docker compose exec api npx prisma migrate dev --name init_admin_schema
```

prisma/migrations/ が作成され、DBにテーブルが作成されます

@prisma/client が再生成されます

### 6. Prisma Studio（GUIで確認）
```
docker compose exec api npx prisma studio
```

ブラウザで http://localhost:5555 を開く

User モデルが表示されればOK

### 7. 動作確認（API側）

src/lib/prisma.ts（ホットリロード対策済み）例：
```
import { PrismaClient } from '@prisma/client';
import { IS_PROD } from './env';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (!IS_PROD) globalForPrisma.prisma = prisma;
```

疎通用ルート例（src/server.ts）：
```
import express from 'express';
import { prisma } from './lib/prisma';

const app = express();

app.get('/health/db', async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: 'ok' });
  } catch (e) {
    res.status(500).json({ db: 'ng', error: String(e) });
  }
});

app.get('/users', async (_, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users);
});

const port = Number(process.env.PORT ?? 5000);
app.listen(port, () => console.log(`API on http://localhost:${port}`));
```
### 8. よくあるエラーと対処

P1001（DB接続拒否）
POSTGRES_URL のホスト名・ユーザ・パス・ポートを再確認（ホストは postgres）

relation "User" does not exist
マイグレーション未適用 → npx prisma migrate dev

ホットリロードで接続過多
src/lib/prisma.ts のグローバルキャッシュ実装を必ず使用

### 9. 便利スクリプト（任意）

package.json に追加：
```
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "seed": "ts-node prisma/seed.ts"
  }
}
```
### 10. リセット手順（開発用）
```
docker compose down -v      # コンテナ/ネットワーク/ボリューム削除
docker volume ls            # 残っていないか確認
docker compose up           # 再起動
```