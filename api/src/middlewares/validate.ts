import { Request, Response, NextFunction } from 'express';
import * as z from 'zod';
import { BadRequestError } from '@errors';

/**
 * validateBody 関数について
 * - req.body を対象に、渡された Zod スキーマで型・バリデーション検証を行う。
 * - validateBody 自体は「関数を返す関数」。引数 schema を内側の関数から参照するためのクロージャ構造。
 *
 * ▼ return されたミドルウェアの処理フロー
 * 1. 受け取った schema で safeParse を実行（例外を投げないため try/catch 不要。結果は parsed.success で判定）
 * 2. 失敗時（型エラー・バリデーションエラー）は 400 / BAD_REQUEST を返却して処理を終了
 * 3. 成功時は検証済みデータを req.validatedBody に格納し、next() で次のハンドラ（例: postAdminSession）へ
 *    ※ controller では req.body ではなく req.validatedBody を参照すること
 */
export const validateBody = <S extends z.ZodType>(schema: S) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed =  schema.safeParse(req.body);
    if (!parsed.success) throw new BadRequestError();

    (req as any).validatedBody = parsed.data as z.output<S>;
    next();
  }
};

/**
 * validateQuery関数
 * ・req.query を対象に、渡された Zodスキーマ で型・バリデーション検証を行う。
 * ・validateQuery 自体は「関数を返す関数」。引数 schema を内側の関数から参照するためのクロージャ構造。
 * 
 * ▼ return されたミドルウェアの処理フロー
 * 1. 受け取った schema で safeParse を実行（例外を投げないため try/catch 不要。結果は parsed.success で判定）
 * 2. 失敗時（型エラー・バリデーションエラー）は 400 / BAD_REQUEST を返却して処理を終了
 * 3. 成功時は検証済みデータを req.validatedQuery に格納し、next() で次のハンドラ（例: postAdminSession）へ
 *    ※ controller では req.query ではなく req.validatedQuery を参照すること
 * 
 * @param schema 
 * @returns 
 */
export const validateQuery = <S extends z.ZodType>(schema: S) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) throw new BadRequestError();

    (req as any).validatedQuery = parsed.data as z.output<S>
    next();
  };
};