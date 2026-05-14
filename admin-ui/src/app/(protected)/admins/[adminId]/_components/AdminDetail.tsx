"use client";
import { useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { apiEndpoint } from "@/constants/api";
import { useRouter } from "next/router";
import styles from "./AdminDetail.module.css";
import { checkAxiosError } from "@/lib/error";
import { routes } from "@/constants/routes";

type Props = {
  adminId: string;
};

const AdminDetail = ({ adminId }: Props) => {
  const router = useRouter();

  useEffect(() => {
    const getAdminDetail = async () => {
      try {
        const res = await apiClient.get(apiEndpoint.ADMIN_DETAIL(adminId));
      } catch (error) {
        if (!checkAxiosError(error)) {
          router.replace(routes.SERVER_ERROR);
          return;
        }

        // エラー判定用のステータスを取得※取得できない場合はサーバーエラー
        const status = error.response?.status;
        if (!status) {
          router.replace(routes.SERVER_ERROR);
          return;
        }

        switch (status) {
          case 400:
            // 一旦何もしない
            return;
          case 401:
            router.replace(routes.SESSION_ERROR);
            return;
          case 500:
          default:
            router.replace(routes.SERVER_ERROR);
            return;
        }
      }
    };
    getAdminDetail();
  }, [router]);
  return (
    <div className={styles["admin-detail"]}>
      <div className={styles["action-area"]}></div>
    </div>
  );
};

export default AdminDetail;
