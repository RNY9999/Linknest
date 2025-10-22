import { redis } from "@lib/redis"
import { sessionKey, RawSession, AdminSessionInfo } from "@types";

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