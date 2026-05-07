// linknest ステータス関連の定数

// 管理者ステータス
export const AdminStatuses = {
  TMP_REGISTER: 1,
  TMP_REGISTER_LOCK: 2,
  REGISTER: 3,
  REGISTER_LOCK: 4,
  REGISTER_RETIRE: 5
} as const;

// 管理者ステータスマスタ取得API (/api/admin/admin-statuses) の各 item の型
export type StatusMasterItem = {
  statusId: number;
  label: string;
  isLocked: boolean;
  displayLabel: string;
};

// 管理者ステータスマスタ取得API (/api/admin/admin-statuses) の型
export type StatusMaster = {
  data: {
    items: Array<StatusMasterItem>;
  };
};