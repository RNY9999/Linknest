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
import { Admin, getAdminsQuery as Query } from "@/constants/admins";

// TODO: 他のコンポーネントでも使用する場合共有ファイルへ移動する。
const sortDesc = "desc";
const sortAsc = "asc";

// TODO: 他のコンポーネントでも使用する場合共有ファイルへ移動する。
const adminListHeader = [
  { label: "管理者ID", id: "adminId" },
  { label: "メールアドレス", id: "email" },
  { label: "表示名", id: "displayName" },
  { label: "ステータス", id: "statusId" },
  { label: "最終ログイン日時", id: "lastLoginAt" },
  { label: "アカウント作成日時", id: "createdAt" },
];

/**
 * クエリパラメータ生成用関数
 * perPage に関しては使用しないが、今後使用するかもしれないので引数としては用意しておく
 */

const buildQuery = (queryParams: Query) => {
  const sp = new URLSearchParams();
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const str = sp.toString();
  return str ? `?${str}` : "";
};

const breadcrumbItems = [
  { label: "ホーム", path: routes.TOP },
  { label: "管理者一覧", path: routes.ADMINS },
];

const AdminsPage = () => {
  const router = useRouter();

  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [admins, setAdmins] = useState<Admin[]>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Query用
  const [sortBy, setSortBy] = useState<string>();
  const [sortOrder, setSortOrder] = useState<string>();
  const [adminId, setAdminId] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [displayName, setDisplayName] = useState<string>();
  const [statusId, setStatusId] = useState<string>();

  const meta = { total, page, perPage };

  const onChangePage = (page: number) => {
    setPage(page);
  };

  const handleSearchAdmin = (
    inputAdminId: string,
    inputEmail: string,
    inputDisplayName: string,
    inputStatusId: string,
  ) => {
    setAdminId(inputAdminId);
    setEmail(inputEmail);
    setDisplayName(inputDisplayName);
    setStatusId(inputStatusId);

    setSortBy("");
    setSortOrder("");
    setPage(1);
  };

  const handleSortAdmins = (inputSortBy: string) => {
    // sort順 desc → asc → desc をサイクル
    // 同じ sortBy を選択した時（=2回連続同じカラムでソートをかけている）
    if (inputSortBy === sortBy) {
      if (sortOrder === sortAsc) {
        setSortOrder(sortDesc);
      } else {
        setSortOrder(sortAsc);
      }
    } else {
      setSortOrder(sortDesc);
    }

    // Page は 1へ戻す
    setSortBy(inputSortBy);
    setPage(1);
  };

  /**
   * 管理者一覧取得
   */
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
    let timeoutId: ReturnType<typeof setTimeout>;
    const getAdmins = async () => {
      try {
        setIsLoading(true);
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
      } finally {
        timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    };
    getAdmins();
    return () => clearTimeout(timeoutId);
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
  return (
    <ProtectedPageTemplate>
      <Breadcrumb items={breadcrumbItems} />
      <div className={styles.searchField}>
        <h2 className={styles.searchField__title}>管理者一覧</h2>
        <AdminSearchForm handleSearchAdmin={handleSearchAdmin} />
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
                  <p
                    className={`${styles.adminList__title} ${sortBy === headerInfo.id ? styles.isSorted : ""}`}
                  >
                    {headerInfo.label}
                  </p>
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
          {isLoading ? (
            <>
              {Array.from({ length: perPage }).map((_, index) => {
                return (
                  <div
                    className={`${styles.adminList__admin} ${index + 1 === perPage ? styles.isLast : ""} ${styles["--isSkeleton"]}`}
                    key={`skeleton-${index}`}
                  >
                    <p className={styles.adminList__data}></p>
                    <p className={styles.adminList__data}></p>
                    <p className={styles.adminList__data}></p>
                    <p className={styles.adminList__data}></p>
                    <p className={styles.adminList__data}></p>
                    <p className={styles.adminList__data}></p>
                  </div>
                );
              })}
            </>
          ) : (
            admins?.map((admin, index) => {
              return (
                <Link
                  href={routes.ADMIN_DETAIL(admin.adminId)}
                  key={admin.adminId}
                  className={`${styles.adminList__admin} ${admins.length === index + 1 ? styles.isLast : ""}`}
                >
                  <p className={styles.adminList__data}>
                    {admin?.adminId ?? "-"}
                    {admin?.isMe && "（自分）"}
                  </p>
                  <p className={styles.adminList__data}>
                    {admin?.email ?? "-"}
                  </p>
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
            })
          )}
        </div>
        <Pagination meta={meta} onChangePage={onChangePage} />
      </div>
    </ProtectedPageTemplate>
  );
};

export default AdminsPage;
