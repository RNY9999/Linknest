// api/admin/admins で取得できる 管理者情報の型
export type Admin = {
  adminId: string;
  email: string;
  displayName: string;
  status: {
    statusId: number;
    label: string;
    isLocked: boolean;
    displayLabel: string;
  };
  lastLoginAt: string;
  createdAt: string;
  isMe: boolean;
};

// api/admin/admins 用の QueryParams の型
export type getAdminsQuery = {
  adminId?: string;
  email?: string;
  displayName?: string;
  statusId?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  perPage?: number;
};