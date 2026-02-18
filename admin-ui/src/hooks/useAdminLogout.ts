'use client';

import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { apiEndpoint } from '@/constants/api';
import { routes } from '@/constants/routes';

export const useAdminLogout = () => {
  const router = useRouter();

  const logout = async () => {
    try {
      await apiClient.delete(apiEndpoint.ADMIN_LOGOUT);
    } catch {
      // 失敗しても強制的にログインへ
    } finally {
      router.replace(routes.LOGIN);
    }
  };

  return { logout };
};
