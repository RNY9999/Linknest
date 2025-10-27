import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

/**
 * seedの使用方法
 * 開発時にコンテナ起動と同時に、DB内に投入しておきたいデータ（マスタデータなど）を一括で投入する
 * マスタ系のテーブルとリレーションを結ぶデータがあるのでマスタ系から先に投入すること
 * 
 * seedデータのインサートコマンド
 * npx prisma db seed
 */
const main = async () => {

  // AdminStatus
  await prisma.$transaction(
    [
      prisma.adminStatus.upsert(
        {
          where: {statusId: 1},
          update: {status: "仮登録"},
          create: {statusId: 1, status: "仮登録"}
        },
      ),
      prisma.adminStatus.upsert(
        {
          where: {statusId: 2},
          update: {status: "仮登録_ロック"},
          create: {statusId: 2, status: "仮登録_ロック"}
        },
      ),
      prisma.adminStatus.upsert(
        {
          where: {statusId: 3},
          update: {status: "本登録"},
          create: {statusId: 3, status: "本登録"}
        },
      ),
      prisma.adminStatus.upsert(
        {
          where: {statusId: 4},
          update: {status: "本登録_ロック"},
          create: {statusId: 4, status: "本登録_ロック"}
        },
      ),
      prisma.adminStatus.upsert(
        {
          where: {statusId: 5},
          update: {status: "本登録_退職済み"},
          create: {statusId: 5, status: "本登録_退職済み"}
        },
      ),
    ]
  )
};

main()
  .catch((error) => { console.error(error); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); })