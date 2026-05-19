"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { apiEndpoint } from "@/constants/api";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./AdminDetail.module.css";
import { checkAxiosError } from "@/lib/error";
import { routes } from "@/constants/routes";
import AdminDetailCard from "./AdminDetailCard";
import AdminLoginLogs from "./AdminLoginLogs";
import ConfirmDialog from "@/components/ConfirmDialog.tsx/ConfirmDialog";
import { formatIsoToJst } from "@/lib/date/formatJst";
import { toaster } from "@/constants/toaster";
import Toaster from "@/components/Toaster/Toaster";

type Props = {
  adminId: string;
};

type AdminDetailData = {
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

type AdminSecurityData = {
  otpExpiredAt: null | string;
  otpFailureCount: number;
  loginFailureCount: number;
  lastLoginFailedAt: string;
  lastLoginAt: string;
};

type AdminLoginLogData = {
  occurredAt: string;
  status: string;
  statusLabel: string;
  ipAddress: string;
  userAgent: string;
};

type AdminPermissionsData = {
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
};

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
  "ログイン失敗回数",
  "ログイン失敗日時",
  "ログイン成功日時",
];

// keys と values の配列の数は合わせること
const adminBasicInfoTitle = "基本情報";
const adminSecurityInfoTitle = "セキュリティ情報";

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

const adminStatusLabels: Record<number, string[]> = {
  1: ["仮登録"],
  2: ["仮登録"],
  3: ["本登録"],
  4: ["本登録"],
  5: ["退職済み", "退職済み"],
};

const isLockedLabel = "ロック中";
const createAdminStatusLabels = (statusId: number, isLocked: boolean) => {
  const result: string[] = adminStatusLabels[statusId] ?? [];
  if (isLocked && !result.includes(isLockedLabel)) result.push(isLockedLabel);
  return result;
};

const setIsLockedCss = (isLocked: boolean, label: string) => {
  return isLocked && label === isLockedLabel ? "--is-locked" : "";
};

const AdminDetail = ({ adminId }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const [adminDetail, setAdminDetail] = useState<AdminDetailData>();
  const [adminSecurity, setAdminSecurity] = useState<AdminSecurityData>();
  const [adminLoginLogs, setAdminLoginLogs] = useState<AdminLoginLogData[]>([]);
  const [adminPermissions, setAdminPermissions] =
    useState<AdminPermissionsData>();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>("");
  const [dialogMessage, setDialogMessage] = useState<string>("");
  const [dialogOnConfirm, setDialogOnConfirm] = useState<() => void>(() => {});

  const adminBasicInfoValues = [
    adminDetail?.adminId ?? "-",
    adminDetail?.email ?? "-",
    adminDetail?.displayName ?? "-",
    adminDetail?.status.displayLabel ?? "-",
    formatIsoToJst(adminDetail?.createdAt ?? "") || "-",
    formatIsoToJst(adminDetail?.updatedAt ?? "") || "-",
  ].map(String);

  const adminSecurityInfoValues = [
    formatIsoToJst(adminSecurity?.otpExpiredAt ?? "") || "-",
    adminSecurity?.otpFailureCount ?? "-",
    adminSecurity?.loginFailureCount ?? "-",
    formatIsoToJst(adminSecurity?.lastLoginFailedAt ?? "") || "-",
    formatIsoToJst(adminSecurity?.lastLoginAt ?? "") || "-",
  ].map(String);

  const adminBasicInfoCardProps: AdminDetailCardProps = {
    title: adminBasicInfoTitle,
    column: createAdminDetailCard(adminBasicInfoKeys, adminBasicInfoValues),
  };

  const adminSecurityInfoCardProps: AdminDetailCardProps = {
    title: adminSecurityInfoTitle,
    column: createAdminDetailCard(
      adminSecurityInfoKeys,
      adminSecurityInfoValues,
    ),
  };

  const adminLoginLogsProps: AdminLoginLogData[] = adminLoginLogs;

  const adminDisplayName = adminDetail?.displayName ?? "-";
  const adminIconChar = adminDisplayName[0];
  const adminEmail = adminDetail?.email ?? "-";
  const adminIsMe = adminDetail?.isMe ?? false;
  const adminStatusId = adminDetail?.status.statusId ?? 0;
  const adminIsLocked = adminDetail?.status.isLocked ?? false;
  const adminStatuses = createAdminStatusLabels(adminStatusId, adminIsLocked);
  const adminLastLoginAt =
    formatIsoToJst(adminDetail?.lastLoginAt ?? "") || "-";
  const adminCanEdit = adminPermissions?.canEdit ?? false;
  const adminCanDelete = adminPermissions?.canDelete ?? false;

  const isUnlockDialogDetail = {
    title: "管理者のロック解除",
    message: `管理者「${adminDisplayName}」のロックを解除してもよろしいですか？`,
    handleUnlock: () => {
      // TODO: 管理者ロック解除APIがまだ未実装のため、API実装後につなぎこみ
      console.log("管理者のロックを解除");
    },
  };

  const isDeleteDialogDetail = {
    title: "管理者の削除",
    message: `管理者「${adminDisplayName}」を削除してもよろしいですか？`,
    handleDelete: () => {
      // TODO: 管理者削除APIは実装済みなので、詳細ページ完成後にAPIつなぎ込み
      const deleteAdmin = async (adminId: string) => {
        try {
          const res = await apiClient.delete(apiEndpoint.ADMIN_DETAIL(adminId));
          if (res.status === 200) {
            console.log("管理者を削除");
            router.replace(routes.ADMINS + toaster.DELETED.param);
          }
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
      }
      deleteAdmin(adminId); // adminId は Props で受け取り済み
    },
  };


  /**
   * トースター用
   */
  useEffect(() => {
    const toast = searchParams.get(toaster.EDITED.key);
    if (toast === toaster.EDITED.value) {
      setShowToast(true);
      setToastMessage(toaster.EDITED.message);
      router.replace(routes.ADMIN_DETAIL(adminId));
    }
  }, [searchParams, router, adminId])

  useEffect(() => {
    const getAdminDetail = async () => {
      try {
        const res = await apiClient.get(apiEndpoint.ADMIN_DETAIL(adminId));
        const resData = res.data.data as {
          admin: AdminDetailData;
          security: AdminSecurityData;
          loginLogs: AdminLoginLogData[];
          permissions: AdminPermissionsData;
        };

        setAdminDetail(resData.admin);
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
      {showToast && <Toaster message={toastMessage} />}
      <div className={styles["action-area"]}>
        <div className={styles["action-area__admin-detail"]}>
          <div className={styles["action-area__icon"]}>{adminIconChar}</div>
          <div className={styles["action-area__info"]}>
            <h3 className={styles["action-area__display-name"]}>
              {`${adminDisplayName} ${adminIsMe ? '（自分）': ''}`}
            </h3>
            <p className={styles["action-area__email"]}>{adminEmail}</p>
            <div className={styles["action-area__status-labels"]}>
              {adminStatuses.map((label) => {
                return (
                  <div
                    key={label}
                    className={`${styles["action-area__status-label"]} ${styles[setIsLockedCss(adminIsLocked, label)]}`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
            <div className={styles["action-area__last-login-at"]}>{`最終ログイン : ${adminLastLoginAt}`}</div>
          </div>
        </div>
        <div className={styles["action-area__buttons"]}>
          {adminCanEdit && (
            <Link
              href={routes.ADMIN_EDIT(adminId)}
              type="button"
              className={`${styles["action-area__button"]} ${styles["--isEdit"]}`}
            >
              編集
            </Link>
          )}
          {adminIsLocked && (
            <button
              type="button"
              className={`${styles["action-area__button"]} ${styles["--isUnlock"]}`}
              onClick={() => {
                setDialogTitle(isUnlockDialogDetail.title);
                setDialogMessage(isUnlockDialogDetail.message);
                setDialogOnConfirm(() => isUnlockDialogDetail.handleUnlock);
                setIsDialogOpen(true);
              }}
            >
              ロック解除
            </button>
          )}
          {adminCanDelete && (
            <button
              type="button"
              className={`${styles["action-area__button"]} ${styles["--isDelete"]}`}
              onClick={() => {
                setDialogTitle(isDeleteDialogDetail.title);
                setDialogMessage(isDeleteDialogDetail.message);
                setDialogOnConfirm(() => isDeleteDialogDetail.handleDelete);
                setIsDialogOpen(true);
              }}
            >
              削除
            </button>
          )}
        </div>
        {isDialogOpen && (
          <ConfirmDialog
            title={dialogTitle}
            message={dialogMessage}
            onConfirm={dialogOnConfirm}
            onCancel={() => setIsDialogOpen(false)}
          />
        )}
      </div>
      <div className={styles["admin-detail-cards"]}>
        <AdminDetailCard {...adminBasicInfoCardProps} />
        <AdminDetailCard {...adminSecurityInfoCardProps} />
      </div>
      <AdminLoginLogs adminLoginLogs={adminLoginLogsProps} />
    </div>
  );
};

export default AdminDetail;
