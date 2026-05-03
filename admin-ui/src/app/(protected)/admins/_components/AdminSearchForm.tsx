"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Form,
  FormField,
  FormInput,
  FormSubmit,
} from "@/components/Form/index";
import styles from "./AdminSearchForm.module.css";
import { apiClient } from "@/lib/apiClient";
import { apiEndpoint } from "@/constants/api";
import { routes } from "@/constants/routes";
import { checkAxiosError } from "@/lib/error";
import { StatusMaster } from "@/constants/status";

type Props = {
  handleSearchAdmin: (
    inputAdminId: string,
    inputEmail: string,
    inputDisplayName: string,
    inputStatusId: string,
  ) => void;
};

const AdminSearchForm = ({ handleSearchAdmin }: Props) => {
  const router = useRouter();
  const [adminId, setAdminId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [statusId, setStatusId] = useState<string>("");
  const [statusMaster, setStatusMaster] = useState<StatusMaster>();
  const isEmpty = statusId === "";

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

    getStatusMaster();
  }, [router]);

  return (
    <Form
      className={styles.searchField}
      id="searchAdminList"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleSearchAdmin(adminId, email, displayName, statusId);
      }}
    >
      <FormField label="管理者ID" htmlFor="adminId">
        <FormInput
          type="number"
          min={1}
          step={1}
          id="adminId"
          name="adminId"
          onChange={(e) => setAdminId(e.target.value)}
        />
      </FormField>
      <FormField label="メールアドレス" htmlFor="email">
        <FormInput
          type="email"
          id="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormField>
      <FormField label="表示名" htmlFor="displayName">
        <FormInput
          type="text"
          id="displayName"
          name="displayName"
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </FormField>
      <FormField label="ステータス" htmlFor="adminStatus">
        <div className={styles.searchField__selectWrapper}>
          <select
            className={`${styles.searchField__select} ${isEmpty ? styles.isEmpty : ""}`}
            id="adminStatus"
            name="adminStatus"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
          >
            <option value="">ステータスを選択</option>
            {statusMaster?.data?.items.map((item) => (
              <option value={String(item.statusId)} key={item.statusId}>
                {item.displayLabel}
              </option>
            ))}
          </select>
        </div>
      </FormField>
      <FormSubmit className={styles.searchField__submit}>検索</FormSubmit>
    </Form>
  );
};

export default AdminSearchForm;
