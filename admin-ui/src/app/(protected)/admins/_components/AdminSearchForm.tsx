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

type StatusMasterItem = {
  statusId: number;
  label: string;
  isLocked: boolean;
  displayLabel: string;
};

type StatusMaster = {
  data: {
    items: Array<StatusMasterItem>;
  };
};

type Props = {
  handleSearchAdmin: (inputAdminId: string, inputEmail: string, inputDisplayName: string, inputStatusId: string) => void;
};

const AdminSearchForm = ({handleSearchAdmin}: Props) => {
  const router = useRouter();
  const [isEmpty, setIsEmpty] = useState(true);
  const [adminId, setAdminId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [statusId, setStatusId] = useState<string>("");
  const [statusMaster, setStatusMaster] = useState<StatusMaster>()

  useEffect(() => {
    const getStatusMaster = async () => {
      try {
        const res = await apiClient.get(apiEndpoint.ADMIN_STATUSES);
        return res?.data?.data;
      } catch {
        router.replace(routes.SERVER_ERROR);
        return;
      }
    }

    setStatusMaster(await getStatusMaster);
  }, [])

  return (
    <Form
      className={styles.searchField}
      id="searchAdminList"
      noValidate={true}
      onSubmit={(e) => {
        e.preventDefault();
        handleSearchAdmin(adminId, email, displayName, statusId)
      }}
    >
      <FormField label="管理者ID" htmlFor="adminId">
        <FormInput type="number" id="adminId" name="adminId" onChange={(e) => setAdminId(e.target.value ?? "")}/>
      </FormField>
      <FormField label="メールアドレス" htmlFor="email">
        <FormInput type="email" id="email" name="email" onChange={(e) => setEmail(e.target.value)}/>
      </FormField>
      <FormField label="表示名" htmlFor="displayName">
        <FormInput type="text" id="displayName" name="displayName" onChange={(e) => setDisplayName(e.target.value)}/>
      </FormField>
      <FormField label="ステータス" htmlFor="adminStatus">
        <div className={styles.searchField__selectWrapper}>
          <select
            className={`${styles.searchField__select} ${isEmpty ? styles.isEmpty : ""}`}
            id="adminStatus"
            name="adminStatus"
            onChange={(e) => {
              setIsEmpty(e.target.value === "");
              setStatusId(e.target.value);
            }}
          >
            <option value="">ステータスを選択</option>
            {statusMaster.data.items.map((item) => {
              return <option value={item.statusId} key={item.statusId}>{item.displayLabel}</option>;
            })}
          </select>
        </div>
      </FormField>
      <FormSubmit className={styles.searchField__submit}>検索</FormSubmit>
    </Form>
  );
};

export default AdminSearchForm;