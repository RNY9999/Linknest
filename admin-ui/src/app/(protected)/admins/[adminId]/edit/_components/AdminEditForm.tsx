"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Form,
  FormField,
  FormInput,
  FormSubmit,
  FormError,
} from "@/components/Form/index";
import { apiClient } from "@/lib/apiClient";
import { apiEndpoint } from "@/constants/api";
import { routes } from "@/constants/routes";
import { checkAxiosError } from "@/lib/error";
import styles from "./AdminEditForm.module.css";
import { StatusMaster } from "@/constants/status";

import { emailSchema, displayNameSchema } from "@/schemas";
import { toaster } from "@/constants/toaster";

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

// email, displayName validation用
const emailId = "email";
const displayNameId = "displayName";

const maxEmailLength = 150;
const maxDisplayNameLength = 100;

const AdminEditForm = ({ adminId }: Props) => {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [statusId, setStatusId] = useState<string>("");
  const [statusMaster, setStatusMaster] = useState<StatusMaster>();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const isEmpty = statusId === "";

  // email, displayName validation用
  const [emailError, setEmailError] = useState<string>("");
  const [displayNameError, setDisplayNameError] = useState<string>("");
  const [emailIsValid, setEmailIsValid] = useState<boolean>(true);
  const [displayNameIsValid, setDisplayNameIsValid] = useState<boolean>(true);

  const emailErrorTimerRef = useRef<number | null>(null);
  const displayNameErrorTimerRef = useRef<number | null>(null);

  const resetEmailError = () => {
    setEmailError("");
  };
  const resetDisplayNameError = () => {
    setDisplayNameError("");
  };

  const isValid = emailIsValid && displayNameIsValid;

  const closeErrorField = () => {
    setErrorMessage("");
  };

  /**
   * 管理者編集処理
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      const sendData = {
        email: email,
        displayName: displayName,
        statusId: statusId,
      };
      const res = await apiClient.patch(
        apiEndpoint.ADMIN_EDIT(adminId),
        sendData,
      );

      // TODO: apiからのNextPathがないが、apiのNextPathによる制御にした方がいいのでは？
      if (res.status === 200) {
        router.replace(routes.ADMIN_DETAIL(adminId) + toaster.EDITED.param);
      }
    } catch (error) {
      // Axiosエラーか同課の判定
      if (!checkAxiosError(error)) {
        router.replace(routes.SERVER_ERROR);
        return;
      }

      const status = error.response?.status; // エラーステータス
      const message = error.response?.data?.message; // エラーメッセージ

      // 何らかの理由（ネットワークエラーなど）で status が取得できない場合はサーバエラー
      if (!status) {
        router.replace(routes.SERVER_ERROR);
        return;
      }

      // TODO エラーステータスをマジックナンバーのように使用してるので後でどこかでまとめた方がいいかも
      switch (status) {
        case 400:
        case 403:
        case 404:
        case 409:
          if (!message) {
            router.replace(routes.SERVER_ERROR);
            return;
          }
          setErrorMessage(message);
          return;
        case 401:
          router.replace(routes.SESSION_ERROR);
          return;
        // → [500] サーバエラー画面へ遷移
        // default → サーバエラー
        case 500:
        default:
          router.replace(routes.SERVER_ERROR);
          return;
      }
    }
  };

  /**
   * email, displayName validation処理
   */
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id;
    const value = e.target.value;

    switch (id) {
      case emailId: {
        // 入力時, エラーを即時消す
        resetEmailError();

        // 既に emailTimer が作動している場合ストップする
        if (emailErrorTimerRef.current) {
          window.clearTimeout(emailErrorTimerRef.current);
        }

        // 前後の空白を処理して入力処理
        if (value.length <= maxEmailLength) {
          setEmail(value);
        }

        // 何も入力されてない場合はエラー文言を表示しない
        if (value.length === 0) {
          setEmailIsValid(false);
          resetEmailError();
          return;
        }

        // zodによるvalidation処理
        const result = emailSchema.safeParse(value);

        if (result.success) {
          setEmailIsValid(true);
          resetEmailError();
          return;
        } else {
          setEmailIsValid(false);
          emailErrorTimerRef.current = window.setTimeout(() => {
            setEmailError(result.error.issues[0].message);
          }, 1000);
        }
        break;
      }
      case displayNameId: {
        // 入力時, エラーを即時消す
        resetDisplayNameError();

        // 既に displayNameTimer が作動している場合ストップする
        if (displayNameErrorTimerRef.current) {
          window.clearTimeout(displayNameErrorTimerRef.current);
        }

        // 前後の空白を処理して入力処理
        if (value.length <= maxDisplayNameLength) {
          setDisplayName(value);
        }

        // 何も入力されてない場合はエラー文言を表示しない
        if (value.length === 0) {
          setDisplayNameIsValid(false);
          resetDisplayNameError();
          return;
        }

        // zodによるvalidation処理
        const result = displayNameSchema.safeParse(value);

        if (result.success) {
          setDisplayNameIsValid(true);
          resetDisplayNameError();
          return;
        } else {
          setDisplayNameIsValid(false);
          displayNameErrorTimerRef.current = window.setTimeout(() => {
            setDisplayNameError(result.error.issues[0].message);
          }, 1000);
        }
        break;
      }
      default:
        break;
    }
  };

  /**
   * 初回レンダリング時・管理者ステータスマスタ取得処理
   *
   * ▼ 処理概要
   * 1. 管理者ステータスマスタ取得APIを叩く
   * 2. 取得に成功した場合, res.data を statusMaster に格納
   * 3. 200 以外の res.status が返ってきた場合
   *    └ Axios Error ではない場合 : サーバーエラー画面へ遷移
   *    └ [401] UNAUTHORIZED : 認証エラー画面へ遷移
   *    └ [500] INTERNAL_SERVER_ERROR : サーバーエラー画面へ遷移
   *    └ その他 openApi に記載のないステータス : サーバーエラー画面へ遷移
   */
  useEffect(() => {
    const getStatusMaster = async () => {
      try {
        const res = await apiClient.get(apiEndpoint.ADMIN_STATUSES);

        if (res.data?.data?.items) {
          setStatusMaster(res.data);
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
    const getAdminDetail = async () => {
      try {
        const res = await apiClient.get(apiEndpoint.ADMIN_DETAIL(adminId));
        const resData = res.data.data as {
          admin: AdminDetailData;
          security: AdminSecurityData;
          loginLogs: AdminLoginLogData[];
          permissions: AdminPermissionsData;
        };

        setEmail(resData.admin.email);
        setDisplayName(resData.admin.displayName);
        setStatusId(String(resData.admin.status.statusId));
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

    getStatusMaster();
    getAdminDetail();
  }, [router, adminId]);

  return (
    <div className={styles["edit-area"]}>
      <h2 className={styles["edit-area__title"]}>管理者の編集</h2>
      <Form
        className={styles["edit-form"]}
        id="editAdmin"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={styles["edit-form__input-area"]}>
          <FormError
            errorMessage={errorMessage}
            closeErrorField={closeErrorField}
          />
          <FormField label="メールアドレス" htmlFor="email">
            <FormInput
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleOnChange}
              className={emailError ? "form__input--has-error" : ""}
            />
          </FormField>
          <p className={`${styles["edit-form__text"]} ${styles["--error"]}`}>
            {emailError}
          </p>
          <FormField label="表示名" htmlFor="displayName">
            <FormInput
              type="text"
              id="displayName"
              name="displayName"
              value={displayName}
              onChange={handleOnChange}
              className={displayNameError ? "form__input--has-error" : ""}
            />
          </FormField>
          <p className={`${styles["edit-form__text"]} ${styles["--error"]}`}>
            {displayNameError}
          </p>
          <FormField label="ステータス" htmlFor="adminStatus">
            <div className={styles["edit-form__select-wrapper"]}>
              <select
                className={`${styles["edit-form__select"]} ${isEmpty ? styles["--empty"] : ""}`}
                id="adminStatus"
                name="adminStatus"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
              >
                {statusMaster?.data?.items.map((item) => (
                  <option value={String(item.statusId)} key={item.statusId}>
                    {item.displayLabel}
                  </option>
                ))}
              </select>
            </div>
          </FormField>
        </div>
        <div className={styles["edit-form__buttons"]}>
          <Link
            href={routes.ADMIN_DETAIL(adminId)}
            type="button"
            className={`${styles["edit-form__button"]} ${styles["--cancel"]}`}
          >
            キャンセル
          </Link>
          <FormSubmit disabled={!isValid}>保存</FormSubmit>
        </div>
      </Form>
    </div>
  );
};

export default AdminEditForm;
