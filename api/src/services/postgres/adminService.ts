import { prisma } from "@lib/prisma";
import argon2 from "argon2";
import { SuccessStatus, ErrorStatus, AdminStatus } from "@types";
import { ResponseStatus, NextPaths, LOGIN_DURATION_MS, AdminStatuses, LOGIN_MAX_FAIL, OTP_MAX_FAIL } from "@config/constants";

const PEPPER: string = process.env.PWD_PEPPER ?? "";
const DUMMY_HASH: string = process.env.DUMMY_ARGON2_HASH ?? "$argon2id$v=19$m=65536,t=2,p=1$c29tZXNhbHQxMjM0NTY3ODkw$4nqjK8oYc3qJ6rW2m0eS7c3y8h8x7sX0P7Fv0oT0w5E";

/**
 * ログイン時のID / password検証
 * 
 * 1. DB から email に対応する admin 情報を取得する
 * 2. argon2 を用いてパスワード検証を行う
 * 3. 検証結果と管理者情報に基づいて、処理の分岐（switch文にて 1~5 まで用意）
 * ※statusId: [1: 仮登録, 2: 仮登録_ロック, 3: 本登録, 4: 本登録_ロック, 5: 本登録_退職済み]
 */
type idPasswordVerifyResult = {
  isVerify: boolean;
  success?: {
    successStatus: SuccessStatus;
    nextPath: string;
    adminInfo: {
      adminId: string;
      adminStatus: AdminStatus;
      email: string;
      displayName: string;
    };
  };
  error?: {
    otpMaxRequest: boolean,
    errorStatus: ErrorStatus;
    loginStartTime?: Date; // statusId = 2, 4の場合 UI 側でログイン可能時間を表示するため
  }
}

type idPasswordVerifyAdminEntity = {
  adminId: bigint;
  email: string;
  displayName: string;
  passwordHash: string;
  statusId: AdminStatus;
  otpFailureCount: number;
  loginFailureCount: number;
  lastLoginFailedAt: Date | null;
  lastLoginAt: Date | null;
}
export const idPasswordVerify = async (email: string, password: string): Promise<idPasswordVerifyResult> => {
  // 1. DB から email に対応する admin 情報を取得する
  const adminRecord = await prisma.admin.findUnique({
    select: {
      adminId: true,
      email: true,
      displayName: true,
      passwordHash: true,
      statusId: true,
      otpFailureCount: true,
      loginFailureCount: true,
      lastLoginFailedAt: true,
      lastLoginAt: true
    },
    where: {
      email: email,
    },
  });

  // 2. argon2 を用いてパスワード検証を行う
  const passwordHash: string = adminRecord?.passwordHash ?? DUMMY_HASH;

  const verifyResult = await argon2.verify(passwordHash, password + PEPPER);
  const now: Date = new Date();
  console.log(verifyResult);
  // admin が存在しない場合（メールアドレスの不一致など）
  if (!adminRecord) {
    return {
      isVerify: false,
      error: {
        otpMaxRequest: false,
        errorStatus: ResponseStatus.UNAUTHORIZED
      }
    }
  }
  // 型情報の整合性を保つために adminRecord を admin へマッピング
  const admin: idPasswordVerifyAdminEntity = {
    adminId: adminRecord.adminId,
    email: adminRecord.email,
    displayName: adminRecord.displayName,
    passwordHash: adminRecord.passwordHash,
    statusId: adminRecord.statusId as AdminStatus,
    otpFailureCount: adminRecord.otpFailureCount,
    loginFailureCount: adminRecord.loginFailureCount,
    lastLoginFailedAt: adminRecord.lastLoginFailedAt,
    lastLoginAt: adminRecord.lastLoginAt
  };

  // otpFailureCount が 5以上の場合 otpMaxRequest: true で返却
  if (admin.otpFailureCount >= OTP_MAX_FAIL) {
    return {
      isVerify: false,
      error: {
        otpMaxRequest: true,
        errorStatus: ResponseStatus.LOCKED
      }
    }
  }

  // 3. 検証結果と管理者情報に基づいて、処理の分岐

  switch (admin.statusId) {
    case AdminStatuses.TMP_REGISTER:
      return handleStatusTmpRegister(admin, verifyResult, now);
    case AdminStatuses.TMP_REGISTER_LOCK:
      return handleStatusTmpRegisterLock(admin, verifyResult, now);
    case AdminStatuses.REGISTER:
      return handleStatusRegister(admin, verifyResult, now);
    case AdminStatuses.REGISTER_LOCK:
      return handleStatusRegisterLock(admin, verifyResult, now);
    case AdminStatuses.REGISTER_RETIRE:
    default:
      return handleStatusRegisterRetire(admin, verifyResult, now);
  }
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

/**
 * アカウントロック時間経過確認関数
 * - アカウントがロックされている状態（statusId = 2, 4)の時に, ロック後30分経過しているかを確認する関数
 * 
 * 処理の流れ
 * 1. 引数に最終ログイン失敗日時（MS）, 現在時間（MS）を受け取る
 * 2. 最終ログイン失敗日時（MS）が null の場合は, 30分経過したと考え true を返す
 * 3. 最終ログイン失敗日時 + 30分 < 現在時間 の比較結果を boolean で返す
 * 
 * 引数と返却値
 * @param lastLoginFailedAt - 最終ログイン失敗日時 ( Date | null )
 * @param now - 現在の時刻 ( Date )
 * @returns boolean / true の場合は30分経過している
 */
const isLockDurationPassed = (lastLoginFailedAt: Date | null, now: Date): boolean => {
  if (!lastLoginFailedAt) {
    return true;
  }
  return lastLoginFailedAt.getTime() + LOGIN_DURATION_MS < now.getTime();
}

/**
 * ロック時, 再ログイン可能時間計算関数
 * @param lastLoginFailedAt - 最終ログイン失敗日時 ( Date | null )
 * @param now - 現在日時 ( Date )
 * @returns 再ログイン可能日時 ( Date )
 * 
 * 処理の流れ
 * 1. 引数で最終ログイン失敗日時と現在日時を受け取る
 * 2. 最終ログイン失敗日時が null でない場合は, 最終ログイン失敗日時 + 30分
 * 3. 最終ログイン失敗日時が null の場合は, 現在時刻 + 30分
 */
const calcLoginStartTime = (lastLoginFailedAt: Date | null, now: Date): Date => {
  if (lastLoginFailedAt) {
    return new Date(lastLoginFailedAt.getTime() + LOGIN_DURATION_MS);
  }
  return new Date(now.getTime() + LOGIN_DURATION_MS);
}

/**
 * パスワード検証_仮登録時のハンドル関数
 * - statusId = 1の際の ID / Password 検証の処理
 *
 * 処理の流れ
 * - statusId = 1 :
 *      - verify = true :
 *        - 202 / ACCEPT / login_failure_count=0, last_login_at を更新
 *      - verify = false :
 *        - login_failure_count = 5:
 *          - 423 / MAX_REQUEST / statusID = 2, login_failure_count = 5, last_login_failed_at を更新
 *        - login_failure_count < 5:
 *          - 401 / UNAUTHORIZED / login_failure_count++, last_login_failed_at を更新
 *
 * 引数と返却値
 * @param admin - 管理者情報
 * @param verifyResult - ID / Password の検証結果
 * @param now - 現在時刻
 * @returns idPasswordVerifyResult(型参照)
 */
const handleStatusTmpRegister = async (admin: idPasswordVerifyAdminEntity, verifyResult: boolean, now: Date): Promise<idPasswordVerifyResult> => {
  if (verifyResult) {
    // 202 / ACCEPT / login_failure_count=0, last_login_at を更新
    await prisma.admin.update({
      where: {
        adminId: admin.adminId
      },
      data: {
        loginFailureCount: 0,
        lastLoginAt: now,
      }
    });

    return {
      isVerify: true,
      success: {
        successStatus: ResponseStatus.ACCEPTED,
        nextPath: NextPaths.FIRST_LOGIN,
        adminInfo: {
          adminId: String(admin.adminId),
          adminStatus: admin.statusId,
          email: admin.email,
          displayName: admin.displayName
        }
      }
    }
  }

  if (admin.loginFailureCount + 1 >= LOGIN_MAX_FAIL) {
    // 423 / MAX_REQUEST / statusID を 2 に更新
    await prisma.admin.update({
      where: { adminId: admin.adminId },
      data: {
        loginFailureCount: LOGIN_MAX_FAIL,
        statusId: AdminStatuses.TMP_REGISTER_LOCK,
        lastLoginFailedAt: now
      }
    });

    return {
      isVerify: false,
      error: {
        otpMaxRequest: false,
        errorStatus: ResponseStatus.LOCKED,
        loginStartTime: calcLoginStartTime(now, now)
      }
    }
  }

  // 401 / UNAUTHORIZED / login_failure_count++, last_login_failed_at を更新
  await prisma.admin.update({
    where: { adminId: admin.adminId },
    data: {
      loginFailureCount: {
        increment: 1
      },
      lastLoginFailedAt: now
    }
  });

  return {
    isVerify: false,
    error: {
      otpMaxRequest: false,
      errorStatus: ResponseStatus.UNAUTHORIZED
    }
  }
}

/**
 * パスワード検証_仮登録_ロック時のハンドル関数
 * - statusId = 2の際の ID / Password 検証の処理
 *
 * 処理の流れ
 *    statusId = 2 :
 *      verify = true :
 *        last_login_failed_at + 30min < now   :
 *          202 / ACCEPT / statusId = 1, login_failure_count=0, last_login_at を更新
 *        last_login_failed_at + 30min >=  now :
 *          423 / MAX_REQUEST
 *      verify = false :
*          423 / MAX_REQUEST
 *
 * 引数と返却値
 * @param admin - 管理者情報
 * @param verifyResult - ID / Password の検証結果
 * @param now - 現在時刻
 * @returns idPasswordVerifyResult(型参照)
 */
const handleStatusTmpRegisterLock = async (admin: idPasswordVerifyAdminEntity, verifyResult: boolean, now: Date): Promise<idPasswordVerifyResult> => {
  if (verifyResult) {
    if (isLockDurationPassed(admin.lastLoginFailedAt, now)) {
      // 202 / ACCEPT / login_failure_count=0, last_login_at を更新
      await prisma.admin.update({
        where: {
          adminId: admin.adminId
        },
        data: {
          statusId: AdminStatuses.TMP_REGISTER,
          loginFailureCount: 0,
          lastLoginAt: now,
        }
      });

      return {
        isVerify: true,
        success: {
          successStatus: ResponseStatus.ACCEPTED,
          nextPath: NextPaths.FIRST_LOGIN,
          adminInfo: {
            adminId: String(admin.adminId),
            adminStatus: AdminStatuses.TMP_REGISTER,
            email: admin.email,
            displayName: admin.displayName
          }
        }
      }
    }
  }

  // 423 / MAX_REQUEST
  // ログイン可能時間を超えてログインに失敗した場合、再度ログイン時間延長
  let loginStartTime = calcLoginStartTime(admin.lastLoginFailedAt, now)
  if (calcLoginStartTime(admin.lastLoginFailedAt, now) < now) {
    loginStartTime = calcLoginStartTime(now, now);

    // lastLoginFailedAtを更新
    await prisma.admin.update({
        where: {
          adminId: admin.adminId
        },
        data: {
          lastLoginFailedAt: now
        }
      });
  }
  return {
    isVerify: false,
    error: {
      otpMaxRequest: false,
      errorStatus: ResponseStatus.LOCKED,
      loginStartTime: loginStartTime
    }
  }
}

/**
 * パスワード検証_本登録時のハンドル関数
 * - statusId = 3の際の ID / Password 検証の処理
 *
 * 処理の流れ
 *    statusId = 3 :
 *      verify = true :
 *        200 / OK / login_failure_count=0, last_login_at を更新
 *      verify = false :
 *        login_failure_count = 5:
 *          423 / MAX_REQUEST / login_failure_count = 5, last_login_failed_at, statusId = 4 を更新
 *        login_failure_count < 5:
 *          401 / UNAUTHORIZED / login_failure_count++, last_login_failed_at を更新
 *
 * 引数と返却値
 * @param admin - 管理者情報
 * @param verifyResult - ID / Password の検証結果
 * @param now - 現在時刻
 * @returns idPasswordVerifyResult(型参照)
 */
const handleStatusRegister = async (admin: idPasswordVerifyAdminEntity, verifyResult: boolean, now: Date): Promise<idPasswordVerifyResult> => {
  if (verifyResult) {
    // 200 / OK / login_failure_count=0, last_login_at を更新
    await prisma.admin.update({
      where: {
        adminId: admin.adminId
      },
      data: {
        loginFailureCount: 0,
        lastLoginAt: now,
      }
    });

    return {
      isVerify: true,
      success: {
        successStatus: ResponseStatus.OK,
        nextPath: NextPaths.TOP,
        adminInfo: {
          adminId: String(admin.adminId),
          adminStatus: admin.statusId,
          email: admin.email,
          displayName: admin.displayName
        }
      }
    }
  }

  if (admin.loginFailureCount + 1 >= LOGIN_MAX_FAIL) {
    // 423 / MAX_REQUEST / login_failure_count = 5, last_login_failed_at, statusId = 4 を更新
    await prisma.admin.update({
      where: { adminId: admin.adminId },
      data: {
        loginFailureCount: LOGIN_MAX_FAIL,
        statusId: AdminStatuses.REGISTER_LOCK,
        lastLoginFailedAt: now
      }
    });

    return {
      isVerify: false,
      error: {
        otpMaxRequest: false,
        errorStatus: ResponseStatus.LOCKED,
        loginStartTime: calcLoginStartTime(now, now)
      }
    }
  }

  // 401 / UNAUTHORIZED / login_failure_count++, last_login_failed_at を更新
  await prisma.admin.update({
    where: { adminId: admin.adminId },
    data: {
      loginFailureCount: {
        increment: 1
      },
      lastLoginFailedAt: now
    }
  });

  return {
    isVerify: false,
    error: {
      otpMaxRequest: false,
      errorStatus: ResponseStatus.UNAUTHORIZED
    }
  }
}

/**
 * パスワード検証_本登録_ロック時のハンドル関数
 * - statusId = 4の際の ID / Password 検証の処理
 *
 * 処理の流れ
 *    statusId = 4 :
 *      verify = true : 
 *        last_login_failed_at + 30min < now   :
 *          200 / OK / login_failure_count=0, last_login_at を更新
 *        last_login_failed_at + 30min >=  now :
 *          423 / MAX_REQUEST
 *      verify = false : 
 *        423 / MAX_REQUEST
 *
 * 引数と返却値
 * @param admin - 管理者情報
 * @param verifyResult - ID / Password の検証結果
 * @param now - 現在時刻
 * @returns idPasswordVerifyResult(型参照)
 */
const handleStatusRegisterLock = async (admin: idPasswordVerifyAdminEntity, verifyResult: boolean, now: Date): Promise<idPasswordVerifyResult> => {
  if (verifyResult) {
    if (isLockDurationPassed(admin.lastLoginFailedAt, now)) {
      // 200 / OK / login_failure_count=0, last_login_at を更新
      await prisma.admin.update({
        where: {
          adminId: admin.adminId
        },
        data: {
          statusId: AdminStatuses.REGISTER,
          loginFailureCount: 0,
          lastLoginAt: now,
        }
      });

      return {
        isVerify: true,
        success: {
          successStatus: ResponseStatus.OK,
          nextPath: NextPaths.TOP,
          adminInfo: {
            adminId: String(admin.adminId),
            adminStatus: AdminStatuses.REGISTER,
            email: admin.email,
            displayName: admin.displayName
          }
        }
      }
    }
  }

  // 423 / MAX_REQUEST
  // ログイン可能時間を超えてログインに失敗した場合、再度ログイン時間延長
  let loginStartTime = calcLoginStartTime(admin.lastLoginFailedAt, now)
  if (calcLoginStartTime(admin.lastLoginFailedAt, now) < now) {
    loginStartTime = calcLoginStartTime(now, now);

    // lastLoginFailedAtを更新
    await prisma.admin.update({
        where: {
          adminId: admin.adminId
        },
        data: {
          lastLoginFailedAt: now
        }
      });
  }
  return {
    isVerify: false,
    error: {
      otpMaxRequest: false,
      errorStatus: ResponseStatus.LOCKED,
      loginStartTime: loginStartTime
    }
  }
}

/**
 * パスワード検証_本登録_退職済み時のハンドル関数
 * - statusId = 5の際の ID / Password 検証の処理
 *
 * 処理の流れ
 *    statusId = 5 :
 *      401 / UNAUTHORIZED
 *
 * 引数と返却値
 * @param admin - 管理者情報
 * @param verifyResult - ID / Password の検証結果
 * @param now - 現在時刻
 * @returns idPasswordVerifyResult(型参照)
 */
const handleStatusRegisterRetire = async (admin: idPasswordVerifyAdminEntity, verifyResult: boolean, now: Date): Promise<idPasswordVerifyResult> => {
  // 401 / UNAUTHORIZED
  return {
    isVerify: false,
    error: {
      otpMaxRequest: false,
      errorStatus: ResponseStatus.UNAUTHORIZED
    }
  }
}