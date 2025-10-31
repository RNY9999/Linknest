import { ApiSuccess, SuccessStatus } from "@types";
import { Response } from "express";

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