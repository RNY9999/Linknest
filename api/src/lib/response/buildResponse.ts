import { ApiError } from "@errors";
import { ApiSuccess, ErrorResponse, SuccessStatus } from "@types";
import { Response } from "express";

/**
 * 成功用 response を生成する関数
 * 1. 引数を受け取って、ApiSuccess 型の response を成型
 * 2. Response Header に Cache-Control : no-store を設定して返却
 * @param res 
 * @param status 
 * @param data 
 * @param meta 
 * @param message 
 * @returns 
 */
export const buildSuccessResponse = <Data, Meta>(res: Response, status: SuccessStatus, data: Data, meta: Meta, message: string = "") : Response => {
  // 返却用のデータを作成
  const responseData:ApiSuccess<Data, Meta> = {
    success: true,
    code: "OK",
    message: message,
    data: data,
    meta: meta
  };

  res.set("Cache-Control", "no-store");
  res.status(status).json(responseData);

  return res;
}

/**
 * 失敗用 response を生成する関数
 * 1. 引数を受け取って ErrorResponse 型の response を成型
 * 2. Response Header に Cache-Control : no-store を設定して返却
 * @param res 
 * @param apiError 
 * @param requestId 
 * @param timestamp 
 * @returns 
 */
export const buildErrorResponse = (res: Response, apiError: ApiError, requestId: string, timestamp: string): Response => {
  // 返却用のデータを作成
  const responseData: ErrorResponse = {
    success: false,
    code: apiError.code,
    message: apiError.message,
    details: apiError.details,
    requestId: requestId,
    timestamp: timestamp,
  }

  res.set("Cache-Control", "no-store");
  res.status(apiError.status).json(responseData);

  return res;
}