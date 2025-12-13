import { prisma } from "@lib/prisma";

type CreateAdminLoginLogInput = {
  adminId?: number | null;
  email?: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: 0 | 1; // 0: 失敗, 1: 成功
};

export const createAdminLoginLog = async (params: CreateAdminLoginLogInput): Promise<void> => {
  try {
    await prisma.adminLoginLog.create({
      data: {
        adminId: params.adminId ?? null,
        email: params.email ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        status: params.status,
      }
    });
  } catch (error) {
    console.error('[set admin login log error] failed ▼ details');
    console.error(JSON.stringify(error));
    console.error('[set admin login log error] failed ▲ details');
  }
}