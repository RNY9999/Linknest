import { Request, Response } from 'express';
import * as adminStatusService from '@services/postgres/adminStatus.service';
import { buildSuccessResponse } from '@lib/response/buildResponse';
import { ResponseStatus } from '@config/constants';
/**
 * 管理者ステータスマスタ取得API
 * 
 * ▼ 処理概要
 * 1. 管理者ステータスマスタを取得
 * 2. 取得したステータスマスタを返却
 */
export const getAdminStatus = async (req: Request, res: Response) => {
  const result = await adminStatusService.getAdminStatus();

  // 2. 取得したステータスマスタを返却
  const data = result.data;
  const message = "管理者ステータスマスタを取得しました。";

  return buildSuccessResponse(req, res, ResponseStatus.OK, data, {}, message);
}