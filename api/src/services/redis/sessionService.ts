import { redis } from "@lib/redis"
import { Request } from "express";
import { sessionKey, RawSession, AdminSessionInfo, ClientInfo } from "@types";
import { createSecureSid } from "@lib/crypto";
import { getClientInfo } from "@lib/request/clientInfo";
import { SESSION_TTL_SEC, SESSION_TTL_MS } from "@config/constants";

/**
 * セッション生成関数
 * 1. req から ip address, user agent を取得する
 * ※セッションの生成に必須ではないため取得できなくてもOK
 * 
 * 2. createSecureSid() にて32バイトのセッションIDを生成する
 * 
 * 3. adminSession を作成し, redis へ保存する
 * 
 * @param req - ip address, user agent の取得を行う
 * @param adminId - session に保存する adminId
 * @param email - session に保存する email
 * @param displayName - session に保存する displayName
 * @returns sid: セッションID（文字列）を返却
 */
export const createSession = async (req: Request, adminId: number, email: string, displayName: string,) => {
  try {
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
     */
    const createdAt: number = Date.now();
    const expiredAt: number = createdAt + SESSION_TTL_MS;

    const adminSession: RawSession = {
      sessionId: ln_admin_sid,
      adminId: adminId,
      email: email,
      displayName: displayName,
      ipAddress: ip,
      userAgent: userAgent,
      createdAt: String(createdAt),
      expiredAt: String(expiredAt)
    }

    const isSet = await redis
      .set(
        sessionKey(ln_admin_sid),
        JSON.stringify(adminSession),
        {
          EX: SESSION_TTL_SEC,
          NX: true
        }
      );

    if (isSet !== "OK") {
      throw new Error("Failed to set session (collision or redis issue)");
    }

    return ln_admin_sid;
  } catch (error) {
    console.log(`[redis]set error: ${error}`);
    return null;
  }
}


/**
 * セッションの検証をする関数
 * returnとして検証結果を返却
 * => 検証に成功した場合：true と Responseに含める内容を返却
 * => 検証に失敗した場合：false
 * @param sid 認証するセッションID / Cookieにより送られてくる
 */
export const verifySession = async (sid: string) => {
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

  // sidをキーとして、セッション情報を取り出す
  const json: string | null = await redis.get(sessionKey(sid));

  if (json) {
    const raw: RawSession = JSON.parse(json);

    const expiredAt: number = new Date(raw.expiredAt).getTime();
    const valid: boolean = Number.isFinite(expiredAt) && expiredAt > now;
    const adminId: number | undefined = raw.adminId ?? undefined;
    const email: string | undefined = raw.email ?? undefined;
    const displayName: string | undefined = raw.displayName ?? undefined;

    if (valid && adminId && email && displayName) {
      verifyResult = true;
      resData = {
        valid: verifyResult,
        expiresAt: String(expiredAt),
        admin: {
          id: adminId,
          email: email,
          displayName: displayName
        }
      }
    }
    console.log(verifyResult);
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