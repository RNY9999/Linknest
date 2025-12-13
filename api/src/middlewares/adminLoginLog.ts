import { Request, Response, NextFunction } from "express";
import { createAdminLoginLog } from "@services/postgres/adminLoginLogService";
import { ResponseStatus } from "@config/constants";

/**
 * 管理者ログインログセットミドルウェア
 * 
 * ▼処理概要
 * 1. request 内から ipAddress, userAgent, email （あれば）を取り出す
 *    ※記録用に取得するので方は緩くする
 * 2. res.on("finish", ...) を用いて追加で必要な情報を取得し, adminId, status, を追加して、admin_login_logs テーブルにログを書き込み
 * @param req - リクエストオブジェクト
 * @param res - レスポンスオブジェクト
 * @param next - ネクスト関数オブジェクト
 */
export const setAdminLoginLog = (req: Request, res: Response, next: NextFunction) => {
  // 1. request 内から ipAddress, userAgent, email （あれば）を取り出す
  const ipAddress = req.ip ?? null;
  const userAgent = req.header("user-agent") ?? null;
  const email = req.body?.email ?? null;

  // res.locals.loginLogに必要な情報を記載 ※実際のログイン処理でさらに adminId を記載してもらう
  res.locals.loginLog = { ipAddress, userAgent, email };

  // 2. res.on("finish", ...) を用いて追加で必要な情報を取得し, adminId, status, を追加して、admin_login_logs テーブルにログを書き込み
  res.on("finish", async () => {
    try {
      const adminId = res.locals.loginLog?.adminId ?? null;
      const isSuccess =
        Number(res.statusCode) === Number(ResponseStatus.OK) ||
        Number(res.statusCode) === Number(ResponseStatus.ACCEPTED);
      const status: 0 | 1 = isSuccess ? 1 : 0;

      const params = {
        adminId: adminId,
        email: email,
        ipAddress: ipAddress,
        userAgent: userAgent,
        status: status
      } as const;

      await createAdminLoginLog(params);
    } catch (error) {
      console.error('[set admin login log error] failed ▼ details');
      console.error(JSON.stringify(error));
      console.error('[set admin login log error] failed ▲ details');
    }
  });

  next();
}