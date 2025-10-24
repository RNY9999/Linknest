import { IS_DEV } from "@lib/env";
import { prisma } from "@lib/prisma";
import argon2 from "argon2";

const PEPPER: string = process.env.PWD_PEPPER ?? "";
const DUMMY_HASH: string = process.env.DUMMY_ARGON2_HASH ?? "$argon2id$v=19$m=65536,t=2,p=1$c29tZXNhbHQxMjM0NTY3ODkw$4nqjK8oYc3qJ6rW2m0eS7c3y8h8x7sX0P7Fv0oT0w5E";

/**
 * ログイン時のID / password検証
 * 
 * 1) DBから対応するパスワードのハッシュ値を取得
 * 2) argon2を用いてパスワード検証
 */
export const idPasswordVerify = async (email: string, password: string): Promise<boolean> => {
  /**
   * 1) DB(Postgres)からemailに対応するハッシュ値を取得
   */
  const admin: { passwordHash: string } | null = await prisma.admin.findUnique({
    select: {
      passwordHash: true
    },
    where: {
      email: email,
    },
  });

  const passwordHash: string = admin?.passwordHash ?? DUMMY_HASH;

  /**
   * 2) argon2を用いてパスワード検証
   */
  let verifyResult = false;
  try {
    verifyResult = await argon2.verify(passwordHash, password + PEPPER);
  } catch (error) {
    // errorキャッチ時は特に何も処理はしない
    if (IS_DEV) console.log(`[login]password の検証中にエラーが発生しました: ${error}`);
    verifyResult = false; // 明示的にfalseに設定
  }

  return Boolean(admin && verifyResult);
}

/**
 * アカウントの新規登録（ダミー）
 * ※現在細かく要件を決めていないためとりあえずダミーでサービス関数を用意
 * ※後々新規登録機能の要件を決める際に詳細に記載
 */
export const createAdmin = async (email: string, password: string): Promise<boolean> => {
  try {
    const passwordHash: string = await argon2.hash(password+PEPPER);
    
    const insertData = {
      email: email,
      displayName: email+"/test",
      passwordHash: passwordHash,
      statusId: 3
    }

    await prisma.admin.create({
      data: insertData
    })
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}