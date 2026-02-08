import { NextPaths, ResponseStatus } from "@config/constants";
import { InternalServerError } from "@errors";
import { buildSuccessResponse } from "@lib/response/buildResponse";
import { RegisterAdminInput } from "@schemas/registerAdmin.schema";
import { createAdmin } from "@services/postgres/admins.service";
import { Request, Response } from "express"

/**
 * 管理者登録API
 * 
 * ▼処理概要
 * 1. request 内から email, passwordを取得する
 * 2. admin テーブルに email, passwordを保存する※ password はハッシュ化されて保存される
 *    ・email に重複がある場合 : 409 / Conflict
 *    ・email に重複がない場合 : 201 / Created 
 * @param req - HTTPリクエストオブジェクト
 * @param res - HTTPレスポンスオブジェクト
 * @returns HTTPレスポンス
 */
export const postAdmin = async (req: Request, res: Response) => {
  // 1. request 内から email, passwordを取得する
  const validated = (req as any).validated as RegisterAdminInput | undefined;

  if (!validated) {
    throw new InternalServerError();
  }
  const { email, password } = validated;

  // 2. admin テーブルに email, passwordを保存する※ password はハッシュ化されて保存される
  await createAdmin(email, password);

  const data = {
    nextPath: NextPaths.REGISTER_COMPLETE
  };
  const message: string = "登録完了";

  return buildSuccessResponse(req, res, ResponseStatus.CREATED, data, {}, message)
}