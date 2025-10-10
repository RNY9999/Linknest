import { PrismaClient } from "@prisma/client";
import { IS_PROD } from "./env";

/**
 * (1). globalForPrismaにglobal.prismaを型をだまして作成して代入
 * ※TypeScript上でglobalにprismaというプロパティが存在することを仮定し、型を明示している
 * (2). prismaの用意, この時global.prismaが存在する場合はそのprismaクライアントを使用し、定義されていなければ新しく生成
 * (3). 本番環境以外の環境ではglobal.prismaにprismaをキャッシュさせておく
 * ※ホットリロードなどで何度もリロードされてもglobal.prismaにprismaClientがキャッシュされているため接続数が増えすぎるのを防げる
 */

// (1)グローバル変数で再利用
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// (2)すでにprismaが存在すればそれを使い、なければ新しく作る
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// (3)本番環境以外のときだけグローバルに保持（ホットリロード対策）
if (!IS_PROD) {
  globalForPrisma.prisma = prisma;
}
