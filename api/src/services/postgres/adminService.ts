import { prisma } from "@lib/prisma";
import argon2 from "argon2";
import { SuccessStatus, ErrorStatus, AdminStatus } from "@types";
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
export const idPasswordVerify = async (email: string, password: string): Promise<{ isVerify: boolean, success?: { successStatus: SuccessStatus, nextPath: string, adminInfo: { adminId: string, adminStatus: AdminStatus, email: string, displayName: string } }, error?: { errorStatus: ErrorStatus } }> => {
  /**
   * 1. DB(Postgres)からemailに対応するハッシュ値を取得
   */
  const admin: { adminId: bigint, email: string, displayName: string, passwordHash: string, statusId: number } | null = await prisma.admin.findUnique({
    select: {
      adminId: true,
      email: true,
      displayName: true,
      passwordHash: true,
      statusId: true,
    },
    where: {
      email: email,
    },
  });
  console.log(`[post] admin info: ${admin?.adminId}`);
  console.log(`[post] admin info: ${admin?.email}`);
  console.log(`[post] admin info: ${admin?.displayName}`);
  console.log(`[post] admin info: ${admin?.statusId}`);

  const passwordHash: string = admin?.passwordHash ?? DUMMY_HASH;
  const statusId: number | undefined = admin?.statusId;

  console.log(`[post] statusId: ${statusId}`);

  /**
   * 2. argon2を用いてパスワード検証
   */
  let verifyResult = false;
  let resData: { isVerify: boolean, success?: { successStatus: SuccessStatus, nextPath: string, adminInfo: { adminId: string, adminStatus: AdminStatus, email: string, displayName: string } }, error?: { errorStatus: ErrorStatus } } = {
    isVerify: false,
  };

  verifyResult = await argon2.verify(passwordHash, password + PEPPER);

  console.log(`[post] is verify: ${verifyResult}`);
  console.log(verifyResult && (admin?.adminId && admin.statusId && admin?.email && admin?.displayName));
  if (
    verifyResult && // 検証結果の確認
    (admin?.adminId && admin?.email && admin?.displayName) // adminの情報(adminId, email, displayName)が取得できているか確認
  ) {
    console.log("in");
    verifyResult = true; // 明示的にtrueに設定
    switch (Number(statusId)) {
      case 1:
        resData = {
          isVerify: verifyResult,
          success: {
            successStatus: ResponseStatus.ACCEPTED,
            nextPath: NextPaths.FIRST_LOGIN,
            adminInfo: {
              adminId: String(admin.adminId),
              adminStatus: statusId as AdminStatus,
              email: admin.email,
              displayName: admin.displayName
            }
          }
        }
        break;
      case 2:
      case 4:
        resData = {
          isVerify: !verifyResult,
          error: {
            errorStatus: ResponseStatus.LOCKED,
          }
        }
        break;
      case 3:
        console.log("case 3");
        resData = {
          isVerify: verifyResult,
          success: {
            successStatus: ResponseStatus.OK,
            nextPath: NextPaths.TOP,
            adminInfo: {
              adminId: String(admin.adminId),
              adminStatus: statusId as AdminStatus,
              email: admin.email,
              displayName: admin.displayName
            }
          }
        }
        break;
      case 5:
      default:
        resData = {
          isVerify: !verifyResult,
          error: {
            errorStatus: ResponseStatus.UNAUTHORIZED,
          }
        }
        break;
    }
    console.log("switch is finished");
  } else {
    verifyResult = false; // 明示的にfalseに設定

    resData = {
      isVerify: !verifyResult,
      error: {
        errorStatus: ResponseStatus.UNAUTHORIZED,
      }
    }
  }

  console.dir(resData);
  return resData;
}

/**
 * アカウントの新規登録（ダミー）
 * ※現在細かく要件を決めていないためとりあえずダミーでサービス関数を用意
 * ※後々新規登録機能の要件を決める際に詳細に記載
 */
export const createAdmin = async (email: string, password: string): Promise<boolean> => {
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

}