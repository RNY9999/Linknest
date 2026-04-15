import { prisma } from "@lib/prisma";
import { Admin, Prisma } from "@generated/prisma";
import argon2 from "argon2";
import { SuccessStatus, ErrorStatus, AdminStatus, UpdateAdminOtp, GetAdminsServiceResult, GetAdminDetailServiceResult, ErrorMessage, ErrorCode } from "@types";
import { ResponseStatus, NextPaths, LOGIN_DURATION_MS, AdminStatuses, LOGIN_MAX_FAIL, OTP_MAX_FAIL, DISPLAY_NAME_INIT, PrismaCode, OTP_TTL_MS, NOT_DELETED } from "@config/constants";
import { ConflictError, ForbiddenError, InternalServerError, NotFoundError } from "@errors";
import { createHash, createOtp } from "@lib/crypto";
import { GetAdminsQuery } from "@schemas/getAdminsQuery.schema";
import { adminIsLocked } from "@utils/admins/isLocked";
import { buildStatusLabelForAdminsList } from "@utils/admins/buildStatusLabel";
import { AdminIdParams } from "@schemas/adminIdParams.schema";
import { PatchOtherAdmin } from "@schemas/admin/admins/adminId/patch/body.schema";

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
 * 管理者一覧取得関数
 * @param query - QueryParameter
 * @param loginAdminId  - 現在ログインしている管理者の管理者ID
 * @returns GetAdminsServiceResult
 */
export const getAdmins = async (query: GetAdminsQuery, loginAdminId: bigint): Promise<GetAdminsServiceResult> => {
  const NULLS_SORT_TARGET = 'lastLoginAt';
  const SORT_ASC = 'asc';

  const where = {
    isDeleted: NOT_DELETED,
    ...(query.adminId !== undefined && { adminId: BigInt(query.adminId) }),
    ...(query.email !== undefined && { email: { startsWith: query.email } }),
    ...(query.displayName !== undefined && { displayName: { startsWith: query.displayName } }),
    ...(query.statusId !== undefined && { statusId: query.statusId })
  }
  const take = query.perPage;
  const skip = (query.page - 1) * query.perPage;
  const orderBy = query.sortBy === NULLS_SORT_TARGET
    ? {
      lastLoginAt: {
        sort: query.sortOrder,
        nulls: query.sortOrder === SORT_ASC ? 'first' : 'last'
      }
    }
    : { [query.sortBy]: query.sortOrder };

  const [admins, total] = await prisma.$transaction([
    prisma.admin.findMany({
      select: {
        adminId: true,
        email: true,
        displayName: true,
        adminStatus: {
          select: {
            statusId: true,
            status: true
          }
        },
        lastLoginAt: true,
        createdAt: true
      },
      where,
      take,
      skip,
      orderBy: orderBy as any
    }),
    prisma.admin.count({ where })
  ]);

  const items = admins.map((admin) => {
    return {
      adminId: String(admin.adminId),
      email: admin.email,
      displayName: admin.displayName,
      status: {
        statusId: admin.adminStatus.statusId,
        label: admin.adminStatus.status,
        isLocked: adminIsLocked(admin.adminStatus.statusId as AdminStatus),
        displayLabel: buildStatusLabelForAdminsList(admin.adminStatus.status)
      },
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      isMe: loginAdminId === admin.adminId
    }
  })

  const meta = {
    total: total,
    page: query.page,
    perPage: query.perPage
  }

  const result: GetAdminsServiceResult = {
    data: {
      items: items
    },
    meta: meta
  };

  return result;
};

/**
 * 管理者詳細取得関数
 * 
 * ▼ 処理概要
 * 1. PathParams の adminId から、対応する管理者を取得
 * 2. PPathParams の adminId から、対応する管理者のログインログを取得
 * 3. 型 GetAdminDetailServiceResult の形に成形してリターン
 * 
 * @param query - PathParams
 * @param loginAdminId - 現在ログインしている管理者の管理者ID
 * @return GetAdminDetailServiceResult
 */
export const getAdminDetail = async (params: AdminIdParams, loginAdminId: bigint): Promise<GetAdminDetailServiceResult> => {
  if (params.adminId === undefined) throw new NotFoundError();
  const where = { adminId: BigInt(params.adminId) }
  const take = 20;
  const orderBy = { createdAt: 'desc' };

  const LOGIN_LOG_SUCCESS = 'success';
  const LOGIN_LOG_FAILURE = 'failure';
  const LOGIN_LOG_SUCCESS_LABEL = '成功';
  const LOGIN_LOG_FAILURE_LABEL = '失敗';

  // 1. PathParams の adminId から、対応する管理者を取得
  const adminDetail = await prisma.admin.findUnique({
    select: {
      adminId: true,
      email: true,
      displayName: true,
      adminStatus: {
        select: {
          statusId: true,
          status: true
        }
      },
      otpExpiredAt: true,
      otpFailureCount: true,
      loginFailureCount: true,
      lastLoginFailedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    },
    where
  });

  // 2. PathParams の adminId から、対応する管理者のログインログを取得
  const adminLoginLogs = await prisma.adminLoginLog.findMany({
    select: {
      ipAddress: true,
      userAgent: true,
      status: true,
      createdAt: true
    },
    where,
    take,
    orderBy: orderBy as any
  });

  // 3. 型 GetAdminDetailServiceResult の形に成形してリターン
  if (!adminDetail) throw new NotFoundError();

  const isMe = loginAdminId === adminDetail.adminId;
  const loginLogs = adminLoginLogs.map((log) => {
    return {
      occurredAt: log.createdAt,
      status: log.status ? LOGIN_LOG_SUCCESS : LOGIN_LOG_FAILURE,
      statusLabel: log.status ? LOGIN_LOG_SUCCESS_LABEL : LOGIN_LOG_FAILURE_LABEL,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }
  });

  const result: GetAdminDetailServiceResult = {
    data: {
      admin: {
        adminId: String(adminDetail.adminId),
        email: adminDetail.email,
        displayName: adminDetail.displayName,
        status: {
          statusId: adminDetail.adminStatus.statusId,
          label: adminDetail.adminStatus.status,
          isLocked: adminIsLocked(adminDetail.adminStatus.statusId as AdminStatus),
          displayLabel: buildStatusLabelForAdminsList(adminDetail.adminStatus.status)
        },
        lastLoginAt: adminDetail.lastLoginAt,
        createdAt: adminDetail.createdAt,
        updatedAt: adminDetail.updatedAt,
        isMe: isMe
      },
      security: {
        otpExpiredAt: adminDetail.otpExpiredAt,
        otpFailureCount: adminDetail.otpFailureCount,
        loginFailureCount: adminDetail.loginFailureCount,
        lastLoginFailedAt: adminDetail.lastLoginFailedAt,
        lastLoginAt: adminDetail.lastLoginAt
      },
      loginLogs: loginLogs,
      permissions: {
        canEdit: isMe,
        canDelete: isMe
      }
    }
  }

  return result;
}

/**
 * 管理者（自分を除く）編集関数
 * 
 * ▼ 処理概要
 * 1. params.adminId の存在確認
 *    取得できない場合, 500 / INTERNAL_SERVER_ERROR ※基本はバリデーションが通ってるので取得できるはず
 * 2. 自分自身を編集しようとしていないかの確認
 *    自分自身を編集している場合, 403 / FORBIDDEN
 * 3. 編集対象の存在確認
 *    存在しない場合は, 404 / NOT_FOUND
 * 4. email の重複チェック
 *    重複する場合は, 409 / CONFLICT_ADMIN_EMAIL
 * 5. 更新処理
 * 6. HTTPレスポンス用の data を組み立ててリターン
 * 
 * @param params - 編集対象の管理者ID
 * @param body - 編集対象の編集内容 { email, displayName, statusID }
 * @param loginAdminId - 現在ログインしている管理者の管理者ID
 * @return {data: adminId: string}
 */
export const patchOtherAdmin = async (params: AdminIdParams, body: PatchOtherAdmin, loginAdminId: bigint) => {
  // 1. params.adminId の存在確認
  if (params.adminId === undefined) throw new InternalServerError();
  const adminId: bigint = BigInt(params.adminId);

  // 2. 自分自身を編集しようとしていないかの確認
  if (adminId === loginAdminId) {
    const message: ErrorMessage = '自分自身の管理者情報は更新できません。';
    const code: ErrorCode = 'FORBIDDEN';
    throw new ForbiddenError(message, code);
  }

  // 3. 編集対象の存在確認
  const targetAdmin = await prisma.admin.findUnique({
    where: { adminId }
  });

  if (!targetAdmin) {
    const message: ErrorMessage = "指定した管理者は存在しません。";
    throw new NotFoundError(message);
  }

  // 4. email の重複チェック
  const duplicateEmail = await prisma.admin.findFirst({
    where: {
      email: body.email,
      NOT: { adminId }
    }
  });

  if (duplicateEmail) throw new ConflictError();

  // 5. 更新処理
  await prisma.admin.update({
    where: {adminId},
    data: {
      email: body.email,
      displayName: body.displayName,
      statusId: body.statusId
    }
  });

  // 6. HTTPレスポンス用の data を組み立ててリターン
  const result = {
    data: {
      adminId: String(adminId)
    }
  };

  return result;
}

/**
 * アカウントの新規登録
 * 
 * ▼ 処理概要
 * 1. passwordHashを計算する（PEPPERを付与して計算）
 * 2. displayName の初期値としてメールアドレスの「@」より前の部分を取得
 * 3. email, displayName, passwordHash, statusId=1 を登録※その際 try / catch で P2002 （一意制約が失敗）の場合 409 / ConflictError を返す
 */
export const createAdmin = async (email: string, password: string): Promise<void> => {
  // 1. passwordHashを計算する（PEPPERを付与して計算）
  const passwordHash = await argon2.hash(password + PEPPER);

  // 2. displayName の初期値としてメールアドレスの「@」より前の部分を取得
  const displayName = email.split('@')[0] || DISPLAY_NAME_INIT;

  // 3. email, displayName, passwordHash, statusId=1 を登録※その際 try / catch で P2002 （一意制約が失敗）の場合 409 / ConflictError を返す
  try {
    await prisma.admin.create({
      data: {
        email: email,
        displayName: displayName,
        passwordHash: passwordHash,
        statusId: AdminStatuses.TMP_REGISTER
      }
    })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PrismaCode.UNIQUE_ERROR) {
      throw new ConflictError();
    }

    throw new InternalServerError(
      'サーバーエラーが発生しています',
      ResponseStatus.INTERNAL_SERVER_ERROR,
      "INTERNAL_SERVER_ERROR",
      error
    );
  }
}

/**
 * 管理者用OTP生成・保存関数
 * 
 * ▼ 処理概要
 * 1. OTP を生成する
 * 2. OTP + PEPPER でハッシュ化を行い、ダイジェストをDBに保存する
 * 3. OTP を返却する
 * 
 * @param adminId - 管理者ID: number型
 * @return string : OTP
 */
export const createAdminOtp = async (adminId: number): Promise<string> => {
  // 1. OTP を生成する
  const adminOtp: string = createOtp();

  // 2. OTP + PEPPER でハッシュ化を行い、ダイジェストをDBに保存する
  const adminOtpPepper = process.env.ADMIN_OTP_PEPPER;
  if (!adminOtpPepper) throw new InternalServerError();

  // ハッシュ値計算用の OTP + PEPPER
  const adminOtpAddPepper: string = adminOtp + adminOtpPepper;

  const adminOtpHash: string = createHash(adminOtpAddPepper);
  const otpExpiredAt: Date = new Date((Date.now() + OTP_TTL_MS));

  // ハッシュ値をDBに保存する（管理者は adminId で一意に特定）
  await prisma.admin.update({
    where: {
      adminId
    },
    data: {
      otpCode: adminOtpHash,
      otpExpiredAt: otpExpiredAt
    }
  });

  // 3. OTP を返却する
  return adminOtp;
}

/**
 * 管理者OTP検証関数
 * 
 * ▼処理概要
 * 1. OTP + PEPPER でハッシュ化を行い、ダイジェストを取得する
 * 2. admins テーブルから, adminId が一致する管理者の OTP （ダイジェスト）, OTP有効期限, OTP失敗回数を取得
 * ※ OTP はこの関数から外には出さない（秘匿情報のため）
 * 3. 送られてきたOTPとDBから取得したOTPを比較し、比較結果を返却する
 * └失敗した場合はOTP失敗回数を +1 する
 * 
 * @param otp - ワンタイムパスワード
 * @param adminId - 管理者ID
 * @return 検証結果: true / false
 */
export const verifyAdminOtp = async (receivedAdminOtp: string, adminId: number): Promise<boolean> => {
  // 1. OTP + PEPPER でハッシュ化を行い、ダイジェストを取得する
  const adminOtpPepper = process.env.ADMIN_OTP_PEPPER;
  if (!adminOtpPepper) throw new InternalServerError();

  const receivedAdminOtpAddPepper = receivedAdminOtp + adminOtpPepper;
  const adminOtpHash: string = createHash(receivedAdminOtpAddPepper);

  // 2. admins テーブルから, adminId が一致する管理者の OTP （ダイジェスト）を取得
  const admin = await prisma.admin.findUnique({
    select: {
      otpCode: true,
      otpExpiredAt: true,
      otpFailureCount: true,
    },
    where: {
      adminId: adminId
    }
  });

  // admin.otpFailureCount は undefined も拾うため 型チェックまでは厳格でない == で比較
  if (!admin?.otpCode || !admin?.otpExpiredAt || admin.otpFailureCount == null) throw new InternalServerError();

  const storedAdminOtp: string = admin.otpCode;
  const storedAdminOtpExpiredAt: Date = admin.otpExpiredAt;
  const storedAdminOtpFailureCount: number = admin.otpFailureCount;

  // 3. 両者を比較し、比較結果を返却する

  // 失敗回数が既に5回以上の場合
  if (storedAdminOtpFailureCount >= OTP_MAX_FAIL) return false;

  // 有効期限が切れている場合（OTP自体があっているかは不明, 基本的にはUI側で有効期限切れの際はOTPを送信できないので, 不正なリクエストとみなし、失敗回数をプラス1する）
  if (
    Date.now() > storedAdminOtpExpiredAt.getTime() ||
    adminOtpHash !== storedAdminOtp
  ) {
    const updateOtpFailureCount = storedAdminOtpFailureCount + 1;
    const isMaxRequest: boolean = updateOtpFailureCount >= OTP_MAX_FAIL;

    await prisma.admin.update({
      where: {
        adminId: adminId
      },
      data: {
        otpFailureCount: updateOtpFailureCount,
        ...(isMaxRequest ? { statusId: AdminStatuses.TMP_REGISTER_LOCK } : {})
      }
    });

    return false
  }

  return true;
}

/**
 * 管理者IDから管理者情報1件を取得する関数
 * TODO: returnの型は後から設定
 * @param adminId - 管理者ID
 * @return 管理者情報 
 */
export const getAdminByAdminId = async (adminId: number) => {
  const admin = await prisma.admin.findUnique({
    select: {
      adminId: true,
      email: true,
      displayName: true,
      // passwordHash: false => 秘匿情報なので取得すらしない
      statusId: true,
      // otpCode: false  => 秘匿情報なので取得すらしない
      otpExpiredAt: true,
      otpFailureCount: true,
      loginFailureCount: true,
      lastLoginFailedAt: true,
      lastLoginAt: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    },
    where: {
      adminId: adminId
    }
  });

  return admin;
}

/**
 * 管理者IDから管理者情報１件をアップデートする関数
 */
export const updateAdminOtpByAdminId = async (data: UpdateAdminOtp, adminId: number): Promise<void> => {
  await prisma.admin.update({
    where: {
      adminId: adminId
    },
    data: data
  })
}

/**
 * 管理者IDから管理者１件のステータスをアップデートする関数
 */
export const updateAdminStatusIdByAdminId = async (statusId: AdminStatus, adminId: number) => {
  await prisma.admin.update({
    where: {
      adminId: adminId
    },
    data: {
      statusId: statusId
    }
  });
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