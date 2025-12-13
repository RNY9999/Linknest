import { buildErrorResponse } from "@lib/response/buildResponse";
import { Request, Response, NextFunction } from "express";
import { ApiError, InternalServerError } from "../errors/apiError";

/**
 * 共通エラー処理関数
 * 
 * 1. request から requestId, requestTimestamp を取得
 * 2. error の型が Linknest 独自のエラー型 ApiError に一致しない場合は、InternalServerError として処理する
 * @param error - 明示的に型は unknown として受け取る, 関数内で error の type が ApiError に一致するか確認する
 * @param req 
 * @param res 
 * @param _next - 使用しないため明示的に 「_」 を付与
 * @returns 
 */
const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  // TODO : req の any型は型安全ではないが、改善自体は後々対応
  const requestId: string = (req as any).requestId ?? "unknown";
  const requestTimestamp: string = (req as any).requestTimestamp ?? new Date().toISOString();
  console.log(`[SERVER_ERROR] request_id: ${requestId}`);
  console.log(`[SERVER_ERROR] requestTimestamp: ${requestTimestamp}`);
  console.log('[SERVER_ERROR] Error_log Start');
  console.log(error);
  console.log('[SERVER_ERROR] Error_log End');
  // error の方が ApiError と一致するか確認
  if (!(error instanceof ApiError)) {
    const typeError: ApiError = new InternalServerError("サーバーエラーが発生しています");

    // requestId, timestampはまだ未実装のため仮の値を代入
    return buildErrorResponse(res, typeError, requestId, requestTimestamp);
  }
  
  return buildErrorResponse(res, error, requestId, requestTimestamp);
};

export default errorHandler;