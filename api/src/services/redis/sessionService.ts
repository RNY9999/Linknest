import { redis } from "@lib/redis"
import { Request } from "express";
import { sessionKey, RedisAdminSession, RedisAdminTmpSession, AdminSessionInfo, ClientInfo, AdminStatus, tmpSessionKey, currentSidKey } from "@types";
import { createSecureSid } from "@lib/crypto";
import { getClientInfo } from "@lib/request/clientInfo";
import { SESSION_TTL_SEC, SESSION_TTL_MS, SESSION_TTL_TMP_SEC, SESSION_TTL_TMP_MS, AdminStatuses } from "@config/constants";
import { adminCurrentSidKey, adminSessionKey, adminTmpSessionKey } from "@utils/redis/getKey";

/**
 * セッション生成関数
 * 1. req から ip address, user agent を取得する
 * ※セッションの生成に必須ではないため取得できなくてもOK
 * 
 * 2. createSecureSid() にて32バイトのセッションIDを生成する
 * 
 * 3. adminSession を作成し, redis へ保存する
 * ▼adminStatusにより処理を分岐
 * adminStatus: 1 (仮登録) => 有効期限15分
 * adminStatus: 3 (本登録) => 有効期限30分
 * 
 * Redis 内で Atomicity と Isolation を保つために Lua コマンドを使用
 * 
 * @param req - ip address, user agent の取得を行う
 * @param adminId - session に保存する adminId
 * @param email - session に保存する email
 * @param displayName - session に保存する displayName
 * @returns sid: セッションID（文字列）を返却
 */
export const createSession = async (req: Request, adminId: number, adminStatus: AdminStatus, email: string, displayName: string,) => {
  /**
   * 1. req から ip address, user agent を取得する
   * ※セッションの生成に必須ではないため取得できなくてもOK
   */
  // TODO: いったん ip, userAgent だけで ipChainは使わない。もうちょっと詳しくなったら使用する
  const { ip, userAgent }: ClientInfo = getClientInfo(req);

  /**
   * 2. createSecureSid() にて32バイトのセッションIDを生成する
   */
  const ln_admin_sid: string = createSecureSid();

  /**
   * 3. adminSession を作成し, redis へ保存する
   * ▼adminStatusにより処理を分岐
   * adminStatus: 1 (仮登録) => 有効期限15分
   * adminStatus: 3 (本登録) => 有効期限30分
   * 
   * Redis 内で Atomicity と Isolation を保つために Lua コマンドを使用
   */
  let ttlMs: number = 0;// redis 保存用 有効期限(ms)
  let exSecond: number = 0; // redis 内有効期限(s)
  let redisSessionKey: string = ""; // redis 用の保存キー
  let redisDelSessionKey: string = "" // redis 内単一ログイン用にデリートするデータのキー
  const redisCurrentSidKey = currentSidKey(String(adminId));

  switch (Number(adminStatus)) {
    case AdminStatuses.TMP_REGISTER:
      ttlMs = SESSION_TTL_TMP_MS;
      exSecond = SESSION_TTL_TMP_SEC;
      redisSessionKey = tmpSessionKey(ln_admin_sid);
      redisDelSessionKey = tmpSessionKey(""); // "ln:admin:tmp_sid:" が返ってくる 
      break;
    case AdminStatuses.REGISTER:
      ttlMs = SESSION_TTL_MS;
      exSecond = SESSION_TTL_SEC;
      redisSessionKey = sessionKey(ln_admin_sid);
      redisDelSessionKey = sessionKey(""); // "ln:admin:sid:" が返ってくる 
      break;
    default:
      throw new Error("Failed to set session (collision or redis issue)");
  }

  const createdAt: number = Date.now();
  const expiredAt: number = createdAt + ttlMs;

  const adminSession: RedisAdminSession | RedisAdminTmpSession = {
    sessionId: ln_admin_sid,
    adminId: String(adminId),
    email: email,
    displayName: displayName,
    ipAddress: ip,
    userAgent: userAgent,
    createdAt: String(createdAt),
    expiredAt: String(expiredAt)
  }
  

  /**
   * KEYS[1]: ln:admin:current_sid:${adminId}
   * KEYS[2]: ln:admin:sid:${sid} || ln:admin:tmp_sid:${sid}
   * ARGV[1]: ln_admin_sid
   * ARGV[2]: ln:admin:sid:${sid} || ln:admin:tmp_sid:${sid} に格納する JSON データ
   * ARGV[3]: TTL (秒), exSecondを代入
   * ARGV[4]: ln:admin:sid:${sid} || ln:admin:tmp_sid:${sid} の ${sid} を抜いた部分
   */
  const script = `
    if #KEYS ~= 2 then
      return redis.error_replay("EXPECTED 2 KEYS")
    end

    if #ARGV ~= 4 then
      return redis.error_replay("EXPECTED 4 ARGV")
    end

    local oldSid = redis.call('GET', KEYS[1])
    local ok = redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3], 'NX')
    
    if not ok then
      return 0
    end
    
    redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[3])

    if oldSid and oldSid ~= ARGV[1] then
      redis.call('DEL', ARGV[4] .. oldSid)
    end

    return 1
    `;

  // Lua コマンドによるセッションの確立
  const result = await redis.eval(script, {
    keys: [
      redisCurrentSidKey,
      redisSessionKey
    ],
    arguments: [
      ln_admin_sid,
      JSON.stringify(adminSession),
      String(exSecond),
      redisDelSessionKey
    ]
  })

  if (result !== 1) {
    throw new Error("Failed to set session (collision or redis issue)");
  }

  return ln_admin_sid;
}


/**
 * セッション検証関数
 * 
 * returnとして検証結果を返却
 * => 検証に成功した場合：true と Responseに含める内容を返却
 * => 検証に失敗した場合：false
 * @param sid 認証するセッションID / Cookieにより送られてくる
 */
export const verifySession = async (sid: string, statusId: AdminStatus) => {
  let verifyResult: boolean = false;
  let resData: AdminSessionInfo = { // 型違反にならないように初期化
    valid: true,
    expiresAt: "",
    admin: {
      id: 0,
      email: "",
      displayName: ""
    }
  };
  const now: number = Date.now();

  // adminStatusにより取得する redis の key を変える
  let redisSessionKey: string = "";
  switch (Number(statusId)) {
    case AdminStatuses.TMP_REGISTER:
      redisSessionKey = tmpSessionKey(sid);
      break;
    case AdminStatuses.REGISTER:
      redisSessionKey = sessionKey(sid);
      break;
    default:
      return { verifyResult: false }
  }
  // sidをキーとして、セッション情報を取り出す
  const json: string | null = await redis.get(redisSessionKey);

  if (json) {
    const raw: RedisAdminSession = JSON.parse(json);

    const expiredAt: number = new Date(Number(raw.expiredAt)).getTime();
    const valid: boolean = Number.isFinite(expiredAt) && expiredAt > now;
    const adminId: string | undefined = raw.adminId ?? undefined;
    const email: string | undefined = raw.email ?? undefined;
    const displayName: string | undefined = raw.displayName ?? undefined;

    // adminIdから最新のセッションを取得
    const currentSidKey = adminCurrentSidKey(adminId);
    const currentSid = await redis.get(currentSidKey);


    // 検証成功の条件に sid === currentSid を追加（202/12/6）
    if (
      (valid && adminId && email && displayName && currentSid)
      &&
      (sid === currentSid)
    ) {
      verifyResult = true;
      resData = {
        valid: verifyResult,
        expiresAt: new Date(expiredAt).toISOString().replace(/\.\d{3}Z$/, "Z"),
        admin: {
          id: Number(adminId),
          email: email,
          displayName: displayName
        }
      }
    }

    switch (verifyResult) {
      case verifyResult === true:
        return { verifyResult: verifyResult, resData: resData };
      case verifyResult === false:
        return { verifyResult: verifyResult };
      default:
        return { verifyResult: false };
    }
  }
}

/**
 * セッション取得関数
 * @param sid - セッションID
 * @param adminStatus - 管理者ステータス 
 */
export const getSession = async (sid: string, adminStatus: AdminStatus): Promise<RedisAdminSession | RedisAdminTmpSession> => {
  const sidKey = adminStatus === AdminStatuses.TMP_REGISTER 
    ? adminTmpSessionKey(sid)
    : adminSessionKey(sid);

  // sidKey 内に取得されている型は RedisAdminSession | RedisAdminTmpSession なので強制的に型変更
  const redisAdminSession = (await redis.get(sidKey)) as unknown as RedisAdminSession | RedisAdminTmpSession;

  // expiredAt を UTC ISO 8601 形式に変換する
  redisAdminSession.expiredAt = (new Date(redisAdminSession.expiredAt)).toISOString();
  return redisAdminSession;
}

/**
 * セッション削除関数
 * 1. admin_status, ln_admin_sid から セッションが保存されているパスを取得
 * 2. 保存されているセッションを削除する
 *    ・ln:admin:sid:{sid}
 *    ・ln:admin:current_sid:{adminId}
 * 
 * @param sid - セッションID
 * @param adminStatus - 管理者ステータス（1 ~ 5）
 */
export const deleteSession = async (sid: string, adminStatus: AdminStatus): Promise<void> => {
  const sidKey = Number(adminStatus) === AdminStatuses.TMP_REGISTER
    ? adminTmpSessionKey(sid)
    : adminSessionKey(sid);

  const sidJson = await redis.get(sidKey);

  // sidJson（セッション本体）が存在しない場合は sidKey のみ削除
  if (!sidJson) {
    await redis.del(sidKey);
    return;
  }

  let currentSidKey = "";

  // JSONが破損していた際は共通の500ERRORではなく、sidKey は削除する
  // 基本は共通エラーに飛ばすがここだけ特別対応
  try {
    const adminId = JSON.parse(sidJson)?.adminId
    if (!adminId) {
      await redis.del(sidKey);
      return;
    }
    currentSidKey = adminCurrentSidKey(String(adminId));
  } catch {
    await redis.del(sidKey);
    return;
  }

  await Promise.all([
    redis.del(currentSidKey),
    redis.del(sidKey)
  ]);
}