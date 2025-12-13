import { Request, Response, NextFunction } from "express";

/**
 * Express 用 asyncHandler
 * ・Express では, 非同期関数の reject を自動で検知して, 共通 errorHandler へ渡す処理ができないため, その部分を補うための関数
 * 
 * 1. 引数に, 非同期関数を取る
 * 2. 非同期関数をラッパーした形で、新たな関数を返却する
 * ※その際、返却する関数内で Promise.resolve(asyncFunction()).catch() をすることで Promise の reject を検知して errorHandler へ流している
 * @param asyncFunction 
 */
const asyncHandler = (asyncFunction: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(asyncFunction(req, res, next)).catch((error) => {
      next(error);
    })
  }
}

export default asyncHandler;