// OTP関連情報のアップデート用
export type UpdateAdminOtp = {
  otpCode?: string | null,
  otpExpiredAt?: Date | null,
  otpFailureCount?: number,
}

/**
 * api/src/services/postgres/admins.service.ts > getAdmins の返却値用の型
 */
export type GetAdminsServiceResult = {
  data: {
    items: {
      adminId: string;
      email: string;
      displayName: string;
      status: {
        statusId: number;
        label: string;
        isLocked: boolean;
        displayLabel: string;
      };
      lastLoginAt: Date | null;
      createdAt: Date;
      isMe: boolean;
    }[],
  },
  meta: {
    total: number;
    page: number;
    perPage: number
  }
}

/**
 * api/src/services/postgres/admins.service.ts > getAdminDetail の返却値用の型
 */
export type GetAdminDetailServiceResult = {
  data: {
    admin: {
      adminId: string;
      email: string;
      displayName: string;
      status: {
        statusId: number;
        label: string;
        isLocked: boolean;
        displayLabel: string;
      },
      lastLoginAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      isMe: boolean;
    },
    security: {
      otpExpiredAt: Date | null;
      otpFailureCount: number;
      loginFailureCount: number;
      lastLoginFailedAt: Date | null;
      lastLoginAt: Date | null;
    },
    loginLogs: {
      occurredAt: Date;
      status: string;
      statusLabel: string;
      ipAddress: string | null;
      userAgent: string | null;
    }[],
    permissions: {
      canEdit: boolean;
      canDelete: boolean;
    }
  }
}