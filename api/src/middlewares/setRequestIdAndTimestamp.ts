import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

/**
 * Request ヘッダーへ RequestId と Timestamp を付与する関数
 * 
 * 1. id, timestamp を生成する（クライアントから送信された request に存在する場合もサーバ側で生成する）
 * 2. Request オブジェクトへ requestId, requestTimestamp をセットする
 * 3. responseHeader へ x-request-id, x-request-timestamp をセットして next()
 */
const setRequestIdAndTimestamp = (req: Request, res: Response, next: NextFunction) => {
  const requestId: string = randomUUID();
  const requestTimestamp: string = new Date().toISOString();

  // TODO : req の any型は型安全ではないが、改善自体は後々対応
  (req as any).requestId = requestId;
  (req as any).requestTimestamp = requestTimestamp

  res.set("x-request-id", requestId);
  res.set("x-request-timestamp", requestTimestamp);

  next();
}

export default setRequestIdAndTimestamp;