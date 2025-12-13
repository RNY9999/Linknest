### Prismaとは
---

Prismaは、DB操作を簡単・安全に行うためのORM（Object Relational Mapper）

### Prismaの構成
---

#### 1. Prisma Schema
- DB構造を定義するファイル（schema.prisma）
- モデル（テーブル）やリレーション（関係）をここに書く

#### 2. Prisma Migrate
- スキーマの変更をDBに反映するツール
- `npx prisma migrate dev`でmigrationを作成

#### 3. Prisma Client
- JavaScript / TypeScriptからDBを操作するための自動生成ライブラリ

#### 典型的な構成例

```
my-app/
├─ prisma/
│  └─ schema.prisma   ← データベース設計ファイル
├─ src/
│  ├─ index.ts        ← PrismaClientを呼び出すコード
│  └─ ...
├─ package.json
```

### Prisma開発の流れ
---

#### Step1. プロジェクト作成 ＆ Prisma導入
- 以下コマンドによりPrismaの導入を行う
```
npm init -y // Node.jsプロジェクトの初期化コマンド, -yオプションによってデフォルト設定でnpmプロジェクトを作成
npm i -D prisma // Prismaプロジェクトのインストール, 本番時にはinstallする必要がないため-Dオプションを使用
npx prisma init // Prismaの初期化, prisma/schema.prisma, .envが生成される
```

#### Step2. schema.prismaにモデル定義
- 定義自体の内容は省略, モデル定義の例はこのプロジェクト参照

#### Step3. マイグレーションでDBに反映
- 以下コマンドにより実際にモデルをDBに反映
```
npx prisma migrate dev --name init
```

### 開発時メモ
---
- ローカルのマイグレーションファイルをコンテナ内DBにも反映
```
npx prisma migrate status // マイグレーションファイルの適用済み・未適用を表示

// dev => 開発環境, deploy => 本番・準本番環境
npx prisma migrate dev//
npx prisma migrate deploy // すでに存在するマイグレーションファイルを順にDBに適用

// seed の適用
npx prisma db seed

npx prisma generate // schema.prismaに更新がある場合は実施
```