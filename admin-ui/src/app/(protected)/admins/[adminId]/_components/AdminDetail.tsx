"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { apiEndpoint } from "@/constants/api";
import { useRouter } from "next/navigation";
import styles from "./AdminDetail.module.css";
import { checkAxiosError } from "@/lib/error";
import { routes } from "@/constants/routes";
import AdminDetailCard from "./AdminDetailCard";
import { formatIsoToJst } from "@/lib/date/formatJst";

type Props = {
  adminId: string;
};

type AdminDetail = {
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
  updatedAt: string;
  isMe: boolean;
};

type AdminSecurity = {
  otpExpiredAt: null | string;
  otpFailureCount: number;
  loginFailureCount: number;
  lastLoginFailedAt: string;
  lastLoginAt: string;
};

type AdminLoginLogs = {
  occurredAt: string;
  status: string;
  statusLabel: string;
  ipAddress: string;
  userAgent: string;
}[];

type AdminPermissions = {
  canEdit: boolean;
  canDelete: boolean;
};

type AdminDetailCardColumn = {
  key: string;
  value: string;
}[];

type AdminDetailCardProps = {
  title: string;
  column: AdminDetailCardColumn;
}

const adminBasicInfoKeys = [
  "管理者ID",
  "メールアドレス",
  "表示名",
  "ステータス",
  "作成日時",
  "更新日時",
];

const adminSecurityInfoKeys = [
  "ワンタイムパスワード有効期限",
  "ワンタイムパスワード入力失敗回数",
  'ログイン失敗回数',
  'ログイン失敗日時',
  'ログイン成功日時',
];

// keys と values の配列の数は合わせること
const adminBasicInfoTitle = '基本情報';
const adminSecurityInfoTitle = '基本情報';

const createAdminDetailCard = (
  keys: string[],
  values: string[],
): AdminDetailCardColumn => {
  const result: AdminDetailCardColumn = [];
  
  keys.forEach((k, index) => {
    result.push({
      key: k,
      value: values[index],
    });
  });

  return result;
};

const AdminDetail = ({ adminId }: Props) => {
  const router = useRouter();
  const [adminDetail, setAdminDetail] = useState<AdminDetail>();
  const [adminSecurity, setAdminSecurity] = useState<AdminSecurity>();
  const [adminLoginLogs, setAdminLoginLogs] = useState<AdminLoginLogs>();
  const [adminPermissions, setAdminPermissions] = useState<AdminPermissions>();

  const adminBasicInfoValues = [
    adminDetail?.adminId ?? '-',
    adminDetail?.email ?? '-',
    adminDetail?.displayName ?? '-',
    adminDetail?.status.displayLabel ?? '-',
    formatIsoToJst(adminDetail?.createdAt ?? '') || '-',
    formatIsoToJst(adminDetail?.updatedAt ?? '') || '-'
  ].map(String);

  const adminSecurityInfoValues = [
    formatIsoToJst(adminSecurity?.otpExpiredAt ?? '') || '-',
    adminSecurity?.otpFailureCount ?? '-',
    adminSecurity?.loginFailureCount ?? '-',
    formatIsoToJst(adminSecurity?.lastLoginFailedAt ?? '') || '-',
    formatIsoToJst(adminSecurity?.lastLoginAt ?? '') || '-'
  ].map(String);

  const adminBasicInfoCardProps: AdminDetailCardProps = {
    title: adminBasicInfoTitle,
    column: createAdminDetailCard(adminBasicInfoKeys, adminBasicInfoValues)
  }

  const adminSecurityInfoCardProps: AdminDetailCardProps = {
    title: adminSecurityInfoTitle,
    column: createAdminDetailCard(adminSecurityInfoKeys, adminSecurityInfoValues),
  }

  useEffect(() => {
    const getAdminDetail = async () => {
      try {
        const res = await apiClient.get(apiEndpoint.ADMIN_DETAIL(adminId));
        const resData = res.data.data as {
          admin: AdminDetail;
          security: AdminSecurity;
          loginLogs: AdminLoginLogs;
          permissions: AdminPermissions;
        };

        setAdminDetail(resData.admin);
        console.log(resData.admin);
        setAdminSecurity(resData.security);
        setAdminLoginLogs(resData.loginLogs);
        setAdminPermissions(resData.permissions);
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
  }, [router, adminId]);
  return (
    <div className={styles["admin-detail"]}>
      <div className={styles["action-area"]}></div>
      <AdminDetailCard {...adminBasicInfoCardProps}/>
      <AdminDetailCard {...adminSecurityInfoCardProps}/>
    </div>
  );
};

export default AdminDetail;
