import { IS_DEV } from "@lib/env";
import { prisma } from "@lib/prisma";
import argon2 from "argon2";
import { SuccessStatus, ErrorStatus, ErrorCode } from "@types";
import { ResponseStatus, NextPaths } from "@config/constants";

const PEPPER: string = process.env.PWD_PEPPER ?? "";
const DUMMY_HASH: string = process.env.DUMMY_ARGON2_HASH ?? "$argon2id$v=19$m=65536,t=2,p=1$c29tZXNhbHQxMjM0NTY3ODkw$4nqjK8oYc3qJ6rW2m0eS7c3y8h8x7sX0P7Fv0oT0w5E";

/**
 * ログイン時のID / password検証
 * 
 * 1. DBから対応するパスワードのハッシュ値を取得
 *  => この際statusIdも同時に取得する
 * 2. argon2を用いてパスワード検証
 * 3. 対応する管理者が存在し検証結果がOKの場合は以下に基づきデータを返却
 * => 取得時はstatusIdにより, Response内容が変わる
 *  => statusId: 1. 仮登録           ... 次の処理に進む（いったん202）
 *  => statusId: 2. 仮登録_ロック     ... 423 / MAX_REQUEST
 *  => statusId: 3. 本登録            ... 次の処理に進む（いったん200）
 *  => statusId: 4. 本登録_ロック      ... 423 / MAX_REQUEST
 *  => statusId: 5. 本登録_退職済み     ... おそらく要件内で未検討 => いったん401 / UNAUTHORIZEDにしとく？
 */
export const idPasswordVerify = async (email: string, password: string): Promise<{ isVerify: boolean, status: SuccessStatus | ErrorStatus, errorCode?: ErrorCode, nextPath?: string }> => {
  /**
   * 1. DB(Postgres)からemailに対応するハッシュ値を取得
   */
  const admin: { passwordHash: string, statusId: number } | null = await prisma.admin.findUnique({
    select: {
      passwordHash: true,
      statusId: true,
    },
    where: {
      email: email,
    },
  });

  const passwordHash: string = admin?.passwordHash ?? DUMMY_HASH;
  const statusId: number | undefined = admin?.statusId;

  /**
   * 2. argon2を用いてパスワード検証
   */
  let verifyResult = false;
  const resData: { isVerify: boolean, status: SuccessStatus | ErrorStatus, errorCode?: ErrorCode, nextPath?: string } = {
    isVerify: false,
    status: ResponseStatus.UNAUTHORIZED
  };

  try {
    verifyResult = await argon2.verify(passwordHash, password + PEPPER);
  } catch (error) {
    // errorキャッチ時は特に何も処理はしない
    if (IS_DEV) console.log(`[login]password の検証中にエラーが発生しました: ${error}`);
    verifyResult = false; // 明示的にfalseに設定
  }

  if (admin ?? verifyResult) {
    verifyResult = true; // 明示的にtrueに設定
    switch (statusId) {
      case 1:
        resData.isVerify = verifyResult;
        resData.status = ResponseStatus.ACCEPTED
        resData.nextPath = NextPaths.FIRST_LOGIN
        break;
      case 2:
        resData.isVerify = !verifyResult;
        resData.status = ResponseStatus.LOCKED
        break;
      case 3:
        resData.isVerify = verifyResult;
        resData.status = ResponseStatus.OK
        resData.nextPath = NextPaths.TOP
        break;
      case 4:
        resData.isVerify = !verifyResult;
        resData.status = ResponseStatus.LOCKED;
        break;
      case 5:
        resData.isVerify = !verifyResult;
        resData.status = ResponseStatus.UNAUTHORIZED;
        break;
    }
  } else {
    verifyResult = false; // 明示的にfalseに設定

    resData.isVerify = !verifyResult;
    resData.status = ResponseStatus.UNAUTHORIZED;
  }

  return resData;
}

/**
 * アカウントの新規登録（ダミー）
 * ※現在細かく要件を決めていないためとりあえずダミーでサービス関数を用意
 * ※後々新規登録機能の要件を決める際に詳細に記載
 */
export const createAdmin = async (email: string, password: string): Promise<boolean> => {
  try {
    const passwordHash: string = await argon2.hash(password + PEPPER);

    const insertData = {
      email: email,
      displayName: email + "/test",
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