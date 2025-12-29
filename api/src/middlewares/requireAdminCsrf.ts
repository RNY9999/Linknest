import { Cookies, requestHeaders, ResponseStatus } from "@config/constants";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "@errors";
import { verifyCsrf } from "@services/redis/csrfService";
import { Request, Response, NextFunction } from "express";

/**
 * CSRF検証ミドルウェア
 * 
 * ▼ 処理概要
 * 1. cookie から ln_admin_sid, header から x-csrf-token を取得する
 * └ln_admin_sid が取得できない場合は, 401 / UNAUTHORIZED
 * └x-csrf-token が取得できない場合は, 400 / CSRF_MISSING_HEADER
 * 2. CSRFの検証を行う
 * └検証に失敗した場合, 403 / CSRF_FORBIDDEN
 * 3. 検証成功後 next()
 * @param req - HTTP リクエストオブジェクト
 * @param _res - HTTP レスポンスオブジェクト
 * @param next - NextFunction
 */
const verifyCsrfMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  // 1. cookie から ln_admin_sid, header から x-csrf-token を取得する
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  if (!sid) throw new UnauthorizedError();

  const csrfToken = req.header(requestHeaders.CSRF_TOKEN_HEADER);
  if (!csrfToken) throw new BadRequestError("X-CSRF-Token required", ResponseStatus.BAD_REQUEST, "CSRF_MISSING_HEADER");

  // 2. CSRFの検証を行う
  const verifyCsrfResult = await verifyCsrf(sid, csrfToken);

  if (!verifyCsrfResult) throw new ForbiddenError(); //初期状態で CSRF_FORBIDDEN Error

  // 3. 検証成功後 next()
  next();
}

export default verifyCsrfMiddleware;