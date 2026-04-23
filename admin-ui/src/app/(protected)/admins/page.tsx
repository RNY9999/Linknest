"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ProtectedPageTemplate from "@/components/ProtectedPageTemplate/ProtectedPageTemplate";
import AdminSearchForm from "./_components/AdminSearchForm";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";
import Pagination from "@/components/Pagination/Pagination";
import styles from "./admins.module.css";
import { routes } from "@/constants/routes";
import { apiClient } from "@/lib/apiClient";
import { apiEndpoint } from "@/constants/api";
import { useRouter } from "next/navigation";
import { formatIsoToJst } from "@/lib/date/formatJst";

type Admin = {
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

type Query = {
  adminId?: string;
  email?: string;
  displayName?: string;
  statusId?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  perPage?: number;
};

const AdminsPage = () => {
  const router = useRouter();

  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(20);
  const [admins, setAdmins] = useState<Admin[]>();

  const sortDesc = "desc";
  const sortAsc = "asc";

  // Query用
  const [sortBy, setSortBy] = useState<string>();
  const [sortOrder, setSortOrder] = useState<string>();
  const [adminId, setAdminId] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [displayName, setDisplayName] = useState<string>();
  const [statusId, setStatusId] = useState<string>();

  const meta = { total, page, perPage };
  const breadcrumbItems = [
    { label: "ホーム", path: routes.TOP },
    { label: "管理者一覧", path: routes.ADMINS },
  ];

  const adminListHeader = [
    { label: "管理者ID", id: "adminId" },
    { label: "メールアドレス", id: "email" },
    { label: "表示名", id: "displayName" },
    { label: "ステータス", id: "statusId" },
    { label: "最終ログイン日時", id: "lastLoginAt" },
    { label: "アカウント作成日時", id: "createdAt" },
  ];

  const onChangePage = async (page: number) => {
    try {
      const res = await apiClient.get(
        `${apiEndpoint.ADMIN_ADMINS}?page=${page}`,
      );
      if (
        res.data?.meta?.total &&
        res.data?.meta?.page &&
        res.data?.meta?.perPage &&
        res.data?.data?.items
      ) {
        setTotal(res.data?.meta?.total);
        setPage(res.data?.meta?.page);
        setPerPage(res.data?.meta?.perPage);
        setAdmins(res.data?.data?.items);
      }
    } catch {
      router.replace(routes.SERVER_ERROR);
      return;
    }
  };

  const handleSearchAdmin = async(inputAdminId: string, inputEmail: string, inputDisplayName: string, inputStatusId: string) => {
    setAdminId(inputAdminId);
    setEmail(inputEmail);
    setDisplayName(inputDisplayName);
    setStatusId(inputStatusId);

    setSortBy("");
    setSortOrder("");
    setPage(1);
  }

  const handleSortAdmins = async (inputSortBy: string) => {
    // sort順 desc → asc → desc をサイクル
    if (inputSortBy === sortBy) {
      if (sortOrder === sortAsc) setSortOrder(sortDesc);
      if (sortOrder === sortDesc) setSortOrder(sortAsc);
    } else {
      setSortOrder(sortDesc);
    }

    setSortBy(inputSortBy);
    setPage(1);
  };

  /**
   * クエリパラメータ生成用関数
   * perPage に関しては使用しないが、今後使用するかもしれないので引数としては用意しておく
   */

  const buildQuery = (queryParams: Query) => {
    let query = "?";
    if (queryParams.adminId) query += `adminId=${queryParams.adminId}`;
    if (queryParams.email) query += `&email=${queryParams.email}`;
    if (queryParams.displayName)
      query += `&displayName=${queryParams.displayName}`;
    if (queryParams.statusId) query += `&statusId=${queryParams.statusId}`;
    if (queryParams.sortBy) query += `&sortBy=${queryParams.sortBy}`;
    if (queryParams.sortOrder) query += `&sortOrder=${queryParams.sortOrder}`;
    if (queryParams.page) query += `&page=${queryParams.page}`;
    if (queryParams.perPage) query += `&perPage=${queryParams.perPage}`;

    return query;
  };

  // Query変更時の管理者一覧取得
  useEffect(() => {
    const queryParams: Query = {
      adminId: adminId,
      email: email,
      displayName: displayName,
      statusId: statusId,
      sortBy: sortBy,
      sortOrder: sortOrder,
      page: page,
      perPage: perPage,
    };
    const getAdmins = async () => {
      try {
        const res = await apiClient.get(
          `${apiEndpoint.ADMIN_ADMINS}${buildQuery(queryParams)}`,
        );
        if (
          res.data?.meta?.total !== undefined &&
          res.data?.meta?.page !== undefined &&
          res.data?.meta?.perPage !== undefined &&
          res.data?.data?.items !== undefined
        ) {
          setTotal(res.data?.meta?.total);
          setPage(res.data?.meta?.page);
          setPerPage(res.data?.meta?.perPage);
          setAdmins(res.data?.data?.items);
        }
      } catch {
        router.replace(routes.SERVER_ERROR);
        return;
      }
    };
    getAdmins();
  }, [
    adminId,
    email,
    displayName,
    statusId,
    sortBy,
    sortOrder,
    page,
    perPage,
    router,
  ]);

  // 初回管理者一覧取得API
  useEffect(() => {
    const getAdmins = async () => {
      try {
        const res = await apiClient.get(apiEndpoint.ADMIN_ADMINS);
        if (
          res.data?.meta?.total !== undefined &&
          res.data?.meta?.page !== undefined &&
          res.data?.meta?.perPage !== undefined &&
          res.data?.data?.items !== undefined
        ) {
          setTotal(res.data?.meta?.total);
          setPage(res.data?.meta?.page);
          setPerPage(res.data?.meta?.perPage);
          setAdmins(res.data?.data?.items);
        }
      } catch {
        router.replace(routes.SERVER_ERROR);
        return;
      }
    };
    getAdmins();
  }, [router]);
  return (
    <ProtectedPageTemplate>
      <Breadcrumb items={breadcrumbItems} />
      <div className={styles.searchField}>
        <h2 className={styles.searchField__title}>管理者一覧</h2>
        <AdminSearchForm handleSearchAdmin={handleSearchAdmin}/>
      </div>
      <div className={styles.adminList}>
        <Pagination meta={meta} onChangePage={onChangePage} />
        <div className={styles.adminList__main}>
          <div className={styles.adminList__header}>
            {adminListHeader.map((headerInfo) => {
              return (
                <button
                  key={headerInfo.id}
                  type="button"
                  onClick={() => handleSortAdmins(headerInfo.id)}
                  className={styles.adminList__headerCol}
                >
                  <p className={`${styles.adminList__title} ${sortBy === headerInfo.id ? styles.isSorted : ""}`}>{headerInfo.label}</p>
                  <div className={styles.adminList__sortOrder}>
                    {sortBy === headerInfo.id && sortOrder === sortAsc && (
                      <Image
                        src="/icons/sort/sort-asc.svg"
                        alt=""
                        width={16}
                        height={16}
                      />
                    )}
                    {sortBy === headerInfo.id && sortOrder === sortDesc && (
                      <Image
                        src="/icons/sort/sort-desc.svg"
                        alt=""
                        width={16}
                        height={16}
                      />
                    )}
                    {sortBy !== headerInfo.id && (
                      <Image
                        src="/icons/sort/list-chevrons-up-down.svg"
                        alt=""
                        width={16}
                        height={16}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {admins?.map((admin, index) => {
            return (
              <Link
                href=""
                key={admin.adminId}
                className={`${styles.adminList__admin} ${admins.length === index + 1 ? styles.isLast : ""}`}
              >
                <p className={styles.adminList__data}>
                  {admin?.adminId ?? "-"}
                  {admin?.isMe && "（自分）"}
                </p>
                <p className={styles.adminList__data}>{admin?.email ?? "-"}</p>
                <p className={styles.adminList__data}>
                  {admin?.displayName ?? "-"}
                </p>
                <p className={styles.adminList__data}>
                  <span
                    className={`${admin?.status?.isLocked ? styles.isLocked : styles.isNotLocked}`}
                  >
                    {admin?.status?.displayLabel ?? "-"}
                  </span>
                </p>
                <p className={styles.adminList__data}>
                  {admin?.lastLoginAt === null
                    ? "-"
                    : formatIsoToJst(admin?.lastLoginAt)}
                </p>
                <p className={styles.adminList__data}>
                  {admin?.createdAt === null
                    ? "-"
                    : formatIsoToJst(admin?.createdAt)}
                </p>
              </Link>
            );
          })}
        </div>
        <Pagination meta={meta} onChangePage={onChangePage} />
      </div>
    </ProtectedPageTemplate>
  );
};

export default AdminsPage;
