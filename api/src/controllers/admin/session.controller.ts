import { Request, response, Response } from "express";

/**
 * API仕様
 * Cookieのln_admin_sidを検証し、セッションの有効性を返す。
 * 原則としてSet-Cookieを返さない
 * 
 * 流れとしては、ln_admin_sidからRedis内に一致するln_admin_sidを検索
 * 一致するもので有効なものがあれば、セッションを有効として返す。
 */
export const getAdminSession = async (req: Request, res: Response) => {
  try {
    // TODO1. Cookieから ln_admin_sid を取り出す
    const sid: string = req.cookies?.['ln_admin_sid'];
    if (!sid) {
      res.set('Cache-Control', 'no-store');
      return res.status(401).json({
        "code": "UNAUTHORIZED",
        "message": "セッションが無効です。",
        "nextPath": "/login"
      })
    }
    
    // TODO2. ln_admin_sidをキーとしてRedis内を検索
    // TODO2-1. Redisのセットアップが終わるまではモックで確認
    // ln_admin_sidがabc123なら、rawを返却
    const mockRow: any = {
        session_id: "abc123",
        admin_id: "2",
        ip_address: "192.168.9.1",
        user_agent: "test agent",
        created_at: "2025-10-13T14:45:59.641Z",
        expired_at: "2025-10-15T14:45:59.641Z"
    }
    const raw: any = sid === "abc123" ? mockRow : null;

    if (!raw) {
      res.set('Cache-Control', 'no-store');
      return res.status(401).json({
        "code": "UNAUTHORIZED",
        "message": "セッションが無効です。",
        "nextPath": "/login"
      })
    }

    // TODO3. 有効なセッションがある場合とそうでない場合で、それぞれ適切なResponseを返す
    const now: Number = Date.now();
    const expired_at: Number = Date.parse(raw.expired_at);
    const valid: boolean = Number.isFinite(expired_at) && expired_at > now;

    if (!valid) {
      res.set('Cache-Control', 'no-store');
      return res.status(401).json({
        "code": "UNAUTHORIZED",
        "message": "セッションが無効です。",
        "nextPath": "/login"
      })
    }

    console.log(`sid: ${sid}`);
    res.set('Cache-Control', 'no-store');
    return res.status(200).json({
      "valid": true,
      "expiresAt": "2025-10-15T14:45:59.641Z",
      "admin": {
        "id": 2,
        "email": "linknest@example.com"
      }
    })

  } catch (error) {
    console.log(error);
  }
}