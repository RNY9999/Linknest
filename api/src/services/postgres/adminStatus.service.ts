import { prisma } from "@lib/prisma";
import { Prisma } from "@generated/prisma";
import { ADMIN_STATUSES_SORT_BY_DEFAULT, ADMIN_STATUSES_SORT_ORDER_DEFAULT } from "@config/constants";
import { adminIsLocked } from "@utils/admins/isLocked";
import { AdminStatus, getAdminStatusServiceResult } from "@types";
import { buildStatusLabelForAdminsList } from "@utils/admins/buildStatusLabel";

/**
 * 管理者ステータスマスタ取得関数
 * 
 * ▼ 処理概要
 * 1. 管理者ステータスマスタの一覧を取得
 * 2. statusId, label, isLocked, displayLabel を生成して返却用のオブジェクトを作成
 */
export const getAdminStatus = async () => {
  // 1. 管理者ステータスマスタの一覧を取得
  const adminStatusList = await prisma.adminStatus.findMany({
    select: {
      statusId: true,
      status: true
    },
    orderBy: {
      [ADMIN_STATUSES_SORT_BY_DEFAULT]: ADMIN_STATUSES_SORT_ORDER_DEFAULT
    }
  });

  // 2. statusId, label, isLocked, displayLabel を生成して返却用のオブジェクトを作成
  const result: getAdminStatusServiceResult = { data: {items: []} };
  adminStatusList.forEach((adminStatus) => {
    const statusId = adminStatus.statusId as AdminStatus;
    const status: string = adminStatus.status;
    const isLocked: boolean = adminIsLocked(statusId);
    const displayLabel = buildStatusLabelForAdminsList(status);

    result.data.items.push({
      statusId: statusId,
      label: status,
      isLocked: isLocked,
      displayLabel: displayLabel
    })
  })

  return result;
}