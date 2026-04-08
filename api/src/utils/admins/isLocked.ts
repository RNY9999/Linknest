import { AdminStatuses } from "@config/constants";
import { AdminStatus } from "@types";

/**
 * 管理者のステータスから、ロック中かどうかをチェックする関数
 */
export const adminIsLocked = (statusId: AdminStatus) => {
  if (
    Number(statusId) === AdminStatuses.REGISTER_LOCK || 
    Number(statusId) === AdminStatuses.TMP_REGISTER_LOCK
  ) return true;

  return false;
}